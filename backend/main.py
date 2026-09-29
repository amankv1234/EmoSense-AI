import os
import sys
import tempfile
import uvicorn
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

# Add src to sys.path so we can import our modules
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "src"))

from inference.emotion_predictor import EmotionPredictor
from memory.user_memory import UserMemory
from generation.responder import EmotionAwareResponder

app = FastAPI(title="Phase 11 Chat Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize modules globally
predictor = EmotionPredictor()
memory_module = UserMemory(db_path=os.path.join(os.path.dirname(__file__), "app_memory.db"))
responder = EmotionAwareResponder(backend="api") # Uses the mock LLM by default

class FeedbackRequest(BaseModel):
    user_id: str
    message_id: str
    thumbs_up: bool

# Simple in-memory chat history per user for the demo
chat_histories = {}

@app.post("/chat")
async def chat(
    user_id: str = Form(...),
    message: str = Form(""),
    audio: Optional[UploadFile] = File(None)
):
    if not message and not audio:
        return {"error": "Provide either message or audio"}

    # Handle Audio if present
    audio_path = None
    if audio:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
            tmp.write(await audio.read())
            audio_path = tmp.name

    # Step 1: Emotion Prediction
    if audio_path and message:
        emo_res = predictor.predict_fused(message, audio_path)
    elif audio_path:
        emo_res = predictor.predict_voice(audio_path)
    else:
        emo_res = predictor.predict_text(message)
        
    detected_emotion = emo_res["top_emotion"]
    confidence = emo_res["confidence"]

    # Step 2: Memory Retrieval
    # Retrieve memories based on current message and emotion
    memories = memory_module.retrieve(user_id, message, detected_emotion, top_k=3)

    # Step 3: Response Generation
    history = chat_histories.get(user_id, [])
    # Pass history (last 4 turns)
    ai_reply = responder.generate_response(
        message, 
        detected_emotion, 
        confidence, 
        memories=memories, 
        chat_history=history[-4:]
    )

    # Step 4: Memory Save
    # We save any new facts learned from the user's message
    memory_module.save_memory(user_id, message, detected_emotion)

    # Update chat history
    history.append({"role": "User", "text": message})
    history.append({"role": "AI", "text": ai_reply})
    chat_histories[user_id] = history

    # Cleanup temp audio
    if audio_path and os.path.exists(audio_path):
        os.remove(audio_path)

    # Return structured response to frontend
    return {
        "reply": ai_reply,
        "emotion": detected_emotion,
        "confidence": confidence,
        "mode": emo_res.get("mode", "unknown")
    }

@app.post("/feedback")
async def feedback(req: FeedbackRequest):
    # In a real app, save this to DB to RLHF/fine-tune the model
    print(f"[Feedback] User {req.user_id} rated message {req.message_id}: {'Up' if req.thumbs_up else 'Down'}")
    return {"status": "success"}

@app.delete("/memory/{user_id}")
async def delete_memory(user_id: str):
    memory_module.delete_user_memory(user_id)
    if user_id in chat_histories:
        del chat_histories[user_id]
    return {"status": "success", "message": f"Memory wiped for {user_id}"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
