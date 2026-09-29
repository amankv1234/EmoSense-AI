import os
import sqlite3
import time
import math
import re
import numpy as np

HAS_SENTENCE_TRANSFORMERS = False

class UserMemory:
    def __init__(self, db_path="user_memory.db"):
        self.db_path = db_path
        self._init_db()
        
        # Load Sentence-BERT if available, else use a fallback strategy
        if HAS_SENTENCE_TRANSFORMERS:
            print("[*] Loading SentenceTransformer for semantic similarity...")
            # all-MiniLM-L6-v2 is fast and lightweight
            self.embedder = SentenceTransformer('all-MiniLM-L6-v2') 
        else:
            print("[Warning] 'sentence-transformers' not installed. Falling back to keyword overlap.")
            self.embedder = None
            
        # Basic emotion valence for computing emotional similarity
        # E.g., Joy and Surprise are closer than Joy and Anger
        self.emotion_vectors = {
            "Neutral":  np.array([0.0,  0.0]),
            "Joy":      np.array([1.0,  0.5]),
            "Surprise": np.array([0.5,  1.0]),
            "Sadness":  np.array([-1.0, -0.5]),
            "Fear":     np.array([-0.5, -1.0]),
            "Anger":    np.array([-1.0,  1.0]),
            "Disgust":  np.array([-0.8, -0.2])
        }

    def _init_db(self):
        """Create SQLite tables if they do not exist."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS users
                     (user_id TEXT PRIMARY KEY, created_at REAL)''')
        c.execute('''CREATE TABLE IF NOT EXISTS memories
                     (id INTEGER PRIMARY KEY AUTOINCREMENT,
                      user_id TEXT,
                      text TEXT,
                      emotion TEXT,
                      timestamp REAL,
                      importance INTEGER,
                      FOREIGN KEY(user_id) REFERENCES users(user_id))''')
        conn.commit()
        conn.close()

    def _ensure_user(self, user_id):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT OR IGNORE INTO users (user_id, created_at) VALUES (?, ?)", (user_id, time.time()))
        conn.commit()
        conn.close()

    def _extract_facts(self, message: str) -> list:
        """
        Rule-based extraction of stable facts. 
        In a production environment, you would use an LLM prompt like:
        "Extract personal facts (name, likes, problems) from: {message}"
        """
        facts = []
        msg_lower = message.lower()
        
        # Basic regex rules for preferences and facts
        like_match = re.search(r"i (?:really )?(like|love|enjoy) (.*)", msg_lower)
        if like_match:
            facts.append((f"User likes {like_match.group(2).strip()}", 3)) # text, importance (1-5)
            
        hate_match = re.search(r"i (?:really )?(hate|dislike|can't stand) (.*)", msg_lower)
        if hate_match:
            facts.append((f"User dislikes {hate_match.group(2).strip()}", 4))
            
        name_match = re.search(r"my name is (\w+)", msg_lower)
        if name_match:
            facts.append((f"User's name is {name_match.group(1).title()}", 5))
            
        problem_match = re.search(r"(?:i have a problem|i'm struggling with) (.*)", msg_lower)
        if problem_match:
            facts.append((f"User is struggling with {problem_match.group(1).strip()}", 4))
            
        # If no explicit facts, save the message itself as a minor memory (importance 1)
        if not facts and len(message.split()) > 3:
            facts.append((message, 1))
            
        return facts

    def save_memory(self, user_id: str, message: str, emotion: str):
        """Extract facts and save to DB."""
        self._ensure_user(user_id)
        facts = self._extract_facts(message)
        
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        current_time = time.time()
        
        for fact_text, importance in facts:
            c.execute('''INSERT INTO memories (user_id, text, emotion, timestamp, importance)
                         VALUES (?, ?, ?, ?, ?)''', 
                      (user_id, fact_text, emotion, current_time, importance))
            print(f"[Memory Saved] -> '{fact_text}' (Emotion: {emotion})")
            
        conn.commit()
        conn.close()

    def _get_embedding(self, text: str):
        if self.embedder:
            return self.embedder.encode(text)
        return None

    def _cosine_similarity(self, vec1, vec2):
        if vec1 is None or vec2 is None: return 0.0
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2) + 1e-9)

    def _keyword_similarity(self, text1, text2):
        """Fallback if no SentenceTransformers"""
        words1 = set(re.findall(r'\w+', text1.lower()))
        words2 = set(re.findall(r'\w+', text2.lower()))
        if not words1 or not words2: return 0.0
        return len(words1.intersection(words2)) / len(words1.union(words2))

    def _emotion_similarity(self, emo1, emo2):
        v1 = self.emotion_vectors.get(emo1, np.array([0,0]))
        v2 = self.emotion_vectors.get(emo2, np.array([0,0]))
        dist = np.linalg.norm(v1 - v2)
        # Convert distance to similarity (max dist is around 2.8)
        return max(0, 1.0 - (dist / 3.0))

    def retrieve(self, user_id: str, current_message: str, current_emotion: str, top_k: int = 5):
        """Retrieve top_k memories combining semantics, recency, importance, and emotion."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT id, text, emotion, timestamp, importance FROM memories WHERE user_id=?", (user_id,))
        rows = c.fetchall()
        conn.close()

        if not rows:
            return []

        current_time = time.time()
        query_emb = self._get_embedding(current_message)

        scored_memories = []
        for row in rows:
            mem_id, text, emotion, timestamp, importance = row
            
            # 1. Semantic Similarity (Weight: 40%)
            if query_emb is not None:
                mem_emb = self._get_embedding(text)
                sim_score = self._cosine_similarity(query_emb, mem_emb)
            else:
                sim_score = self._keyword_similarity(current_message, text)
                
            # 2. Recency Decay (Weight: 20%) - half-life of 7 days
            days_old = (current_time - timestamp) / (86400)
            recency_score = math.exp(-days_old / 7.0)
            
            # 3. Importance (Weight: 20%) - scale 1-5 to 0-1
            importance_score = importance / 5.0
            
            # 4. Emotional Similarity (Weight: 20%)
            emo_score = self._emotion_similarity(current_emotion, emotion)
            
            # Final Score Calculation
            final_score = (0.4 * sim_score) + (0.2 * recency_score) + (0.2 * importance_score) + (0.2 * emo_score)
            
            scored_memories.append({
                "id": mem_id,
                "text": text,
                "emotion": emotion,
                "importance": importance,
                "score": round(final_score, 4)
            })

        # Sort by final score descending
        scored_memories.sort(key=lambda x: x['score'], reverse=True)
        return scored_memories[:top_k]

    def delete_user_memory(self, user_id: str):
        """GDPR/Privacy feature to wipe user memory."""
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("DELETE FROM memories WHERE user_id=?", (user_id,))
        c.execute("DELETE FROM users WHERE user_id=?", (user_id,))
        conn.commit()
        conn.close()
        print(f"[*] Wiped all memory for user '{user_id}'.")


if __name__ == "__main__":
    # Remove old DB for fresh test
    if os.path.exists("user_memory.db"):
        os.remove("user_memory.db")
        
    print("\n" + "="*50)
    print("TESTING PHASE 9: USER MEMORY MODULE")
    print("="*50)
    
    memory = UserMemory()
    USER = "user_123"
    
    # ---------------------------------------------
    # SESSION 1: SAVING FACTS
    # ---------------------------------------------
    print("\n--- [Session 1] User is chatting... ---")
    memory.save_memory(USER, "Hi, my name is Alex", "Neutral")
    memory.save_memory(USER, "I really love cyberpunk movies.", "Joy")
    memory.save_memory(USER, "I'm struggling with learning React.", "Sadness")
    
    # Simulate time passing (artificially set a timestamp in DB to be older if needed, 
    # but for this test they are recent)
    
    # ---------------------------------------------
    # SESSION 2: RETRIEVING FACTS
    # ---------------------------------------------
    print("\n--- [Session 2] User comes back later... ---")
    current_msg = "Can you recommend a movie? I feel a bit sad about my coding progress."
    current_emo = "Sadness"
    
    print(f"\nUser says: '{current_msg}' (Detected: {current_emo})")
    print("Retrieving relevant memories...")
    
    results = memory.retrieve(USER, current_msg, current_emo)
    
    for i, res in enumerate(results, 1):
        print(f"  {i}. {res['text']} | Emotion: {res['emotion']} | Imp: {res['importance']} | Score: {res['score']}")
        
    # ---------------------------------------------
    # PRIVACY WIPE
    # ---------------------------------------------
    print("\n--- [Privacy] Deleting Account... ---")
    memory.delete_user_memory(USER)
    
    # Verify wipe
    check_wipe = memory.retrieve(USER, "Hello", "Neutral")
    print(f"Memories found after wipe: {len(check_wipe)}")
