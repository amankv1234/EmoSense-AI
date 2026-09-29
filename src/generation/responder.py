import re
import os

class EmotionAwareResponder:
    def __init__(self, backend="api", api_key=None, local_model_id="gpt2"):
        """
        backend: "api" or "local"
        """
        self.backend = backend
        self.api_key = api_key
        self.local_model_id = local_model_id
        
        # Crisis detection keywords
        self.crisis_keywords = [
            "kill myself", "suicide", "want to die", "end my life", 
            "self harm", "cut myself", "no reason to live"
        ]
        
        if self.backend == "local":
            print(f"[*] Initializing local Hugging Face model ({local_model_id})...")
            # In production: 
            # from transformers import pipeline
            # self.generator = pipeline("text-generation", model=self.local_model_id)
            self.generator = None
        else:
            print("[*] Initializing API-based LLM backend...")
            # In production: initialize OpenAI / Anthropic client here
            self.client = None

    def _is_crisis(self, message: str) -> bool:
        """Check if message contains self-harm or crisis indicators."""
        msg_lower = message.lower()
        for kw in self.crisis_keywords:
            if kw in msg_lower:
                return True
        return False

    def _build_prompt(self, message, emotion, confidence, memories, chat_history):
        """Construct the system instruction and prompt for the LLM."""
        
        # Determine Tone
        if confidence < 0.4:
            tone_instruction = "The user's emotion is unclear. Maintain a polite, neutral, and helpful tone without assuming their mood."
        else:
            tone_map = {
                "Sadness": "comforting, empathetic, and gentle",
                "Anger": "calm, de-escalating, and understanding",
                "Joy": "celebratory, enthusiastic, and positive",
                "Fear": "reassuring, safe, and supportive",
                "Surprise": "curious and engaged",
                "Disgust": "understanding and validating",
                "Neutral": "helpful and conversational"
            }
            tone_instruction = f"The user is feeling {emotion} (Confidence: {confidence:.2f}). Respond in a tone that is {tone_map.get(emotion, 'neutral')}."

        # Memory inclusion
        memory_text = ""
        if memories:
            mem_bullets = "\n".join([f"- {m['text']}" for m in memories])
            memory_text = f"Relevant facts about the user:\n{mem_bullets}\nUse these facts naturally ONLY if relevant to the current conversation. Do not invent facts."
            
        # Chat History
        history_text = ""
        if chat_history:
            hist = "\n".join([f"{t['role']}: {t['text']}" for t in chat_history])
            history_text = f"Recent conversation history:\n{hist}"

        # Combine into a strict system prompt
        system_prompt = f"""You are an empathetic, emotionally intelligent AI assistant.
Your goal is to provide short, conversational replies (1-3 sentences).

INSTRUCTIONS:
{tone_instruction}
{memory_text}

{history_text}

Respond directly to the user's latest message. Do not be overly robotic.
"""
        return system_prompt

    def _call_llm_mock(self, system_prompt, user_message):
        """Mock LLM response for demonstration purposes."""
        # A real implementation would send `system_prompt` and `user_message` to OpenAI or Transformers pipeline
        
        if "sad" in user_message.lower():
            if "React" in system_prompt:
                return "I'm so sorry you're feeling down about your coding progress. React can be really tough at first, but don't give up! I'm here if you want to vent or talk through a problem."
            return "I'm really sorry you're feeling sad. I'm here for you if you need to talk."
        
        elif "happy" in user_message.lower() or "joy" in system_prompt.lower():
            if "cyberpunk" in system_prompt.lower():
                return "That is awesome news! We definitely need to celebrate by watching a cyberpunk movie tonight!"
            return "That's wonderful! I'm so glad to hear that."
            
        elif "angry" in user_message.lower():
            return "I hear you, and it makes total sense why you're upset. Take a deep breath; I'm here to listen."
            
        elif "unclear" in system_prompt:
            return "I see. How can I help you with that?"
            
        return "I understand. Tell me more about what's on your mind."

    def generate_response(self, message: str, emotion: str, confidence: float, memories: list = None, chat_history: list = None) -> str:
        """Main method to generate the AI response."""
        memories = memories or []
        chat_history = chat_history or []

        # 1. Safety Check (Highest Priority)
        if self._is_crisis(message):
            return ("I'm really sorry you're feeling this way, but please know you're not alone. "
                    "If you're having thoughts of self-harm, please reach out for help immediately. "
                    "You can dial 988 (in the US) or contact a local emergency service/trusted professional. "
                    "I am an AI and cannot provide the help you deserve, but people out there care and want to support you.")

        # 2. Build the Persona Prompt
        system_prompt = self._build_prompt(message, emotion, confidence, memories, chat_history)
        
        # 3. Call Backend
        if self.backend == "api":
            # reply = self.client.chat.completions.create(...)
            reply = self._call_llm_mock(system_prompt, message)
        else:
            # reply = self.generator(f"{system_prompt}\nUser: {message}\nAI:")
            reply = self._call_llm_mock(system_prompt, message)
            
        return reply


if __name__ == "__main__":
    print("\n" + "="*50)
    print("TESTING PHASE 10: RESPONDER MODULE")
    print("="*50)
    
    responder = EmotionAwareResponder(backend="api")
    
    print("\n--- Test 1: Low Confidence Emotion (Neutral Fallback) ---")
    msg = "I guess I'll just go to the store."
    print(f"User: {msg} [Detected: Fear (0.35)]")
    rep = responder.generate_response(msg, "Fear", 0.35)
    print(f"AI: {rep}")

    print("\n--- Test 2: High Emotion + Memory Integration ---")
    msg = "I'm just so sad. I can't get this code to compile."
    mems = [{"text": "User is struggling with learning React", "importance": 4}]
    print(f"User: {msg} [Detected: Sadness (0.89)]")
    print(f"Memories provided: {mems[0]['text']}")
    rep = responder.generate_response(msg, "Sadness", 0.89, memories=mems)
    print(f"AI: {rep}")

    print("\n--- Test 3: High Emotion (Anger) ---")
    msg = "I am so incredibly angry right now!"
    print(f"User: {msg} [Detected: Anger (0.95)]")
    rep = responder.generate_response(msg, "Anger", 0.95)
    print(f"AI: {rep}")

    print("\n--- Test 4: CRISIS / SAFETY OVERRIDE ---")
    msg = "I just want to end my life, everything is terrible."
    print(f"User: {msg} [Detected: Sadness (0.99)]")
    rep = responder.generate_response(msg, "Sadness", 0.99)
    print(f"AI: {rep}")
