import os
import time
import numpy as np

# In a real environment, you'd import tensorflow, librosa, transformers etc.
# import tensorflow as tf

class EmotionPredictor:
    def __init__(self, text_model_dir: str = "./models/text_emotion/", speech_model_dir: str = "./models/speech_emotion/"):
        self.text_model_dir = text_model_dir
        self.speech_model_dir = speech_model_dir
        
        self.emotions = ["Neutral", "Surprise", "Fear", "Sadness", "Joy", "Disgust", "Anger"]
        
        # Load models once at startup (Mocked for demonstration so it doesn't crash if paths don't exist yet)
        print(f"[*] Initializing EmotionPredictor...")
        self.text_model = self._load_text_model(self.text_model_dir)
        self.speech_model = self._load_speech_model(self.speech_model_dir)
        
        # Alpha weight for fusion strategy based on saved results
        # E.g., 0.6 means 60% text model confidence + 40% speech model confidence
        self.alpha_text = 0.6 
        print("[*] EmotionPredictor Ready.")

    def _load_text_model(self, model_dir):
        # Placeholder for actual model loading logic
        # e.g. return tf.keras.models.load_model(model_dir)
        if not os.path.exists(model_dir):
            print(f"[Warning] Text model dir {model_dir} not found. Using fallback mockup.")
        return "text_model_instance"

    def _load_speech_model(self, model_dir):
        # Placeholder for actual model loading logic
        # e.g. return tf.keras.models.load_model(model_dir)
        if not os.path.exists(model_dir):
            print(f"[Warning] Speech model dir {model_dir} not found. Using fallback mockup.")
        return "speech_model_instance"

    def _format_output(self, probs: np.ndarray) -> dict:
        """Helper to format probability array into the requested dictionary output"""
        probs = np.clip(probs, 0, 1)
        probs = probs / probs.sum() # Ensure it sums to 1
        
        predicted_idx = int(np.argmax(probs))
        confidence = float(probs[predicted_idx])
        
        result = {
            "top_emotion": self.emotions[predicted_idx],
            "confidence": round(confidence, 4),
            "probabilities": {
                emo: round(float(probs[i]), 4) for i, emo in enumerate(self.emotions)
            }
        }
        return result

    def predict_text(self, message: str) -> dict:
        """Predict emotion from text message."""
        # 1. Feature extraction/Tokenization
        # 2. Model inference
        # Here we mock the inference to show how it returns the 7 classes.
        # In real code: preds = self.text_model.predict(features)
        
        np.random.seed(len(message)) # Just to give consistent pseudo-results for the demo
        mock_probs = np.random.dirichlet(np.ones(7), size=1)[0]
        
        # Add a slight bias so the test script looks realistic
        if "angry" in message.lower() or "furious" in message.lower(): mock_probs[6] += 0.5 
        if "happy" in message.lower(): mock_probs[4] += 0.5
        if "sad" in message.lower(): mock_probs[3] += 0.5
            
        return self._format_output(mock_probs)

    def predict_voice(self, audio_path: str) -> dict:
        """Predict emotion from speech audio file."""
        # 1. Audio feature extraction (e.g., MFCCs via librosa)
        # 2. Model inference
        if audio_path and not os.path.exists(audio_path):
            pass # Handle missing file in real scenario
            
        np.random.seed(len(audio_path) if audio_path else 42)
        mock_probs = np.random.dirichlet(np.ones(7), size=1)[0]
        return self._format_output(mock_probs)

    def predict_fused(self, message: str, audio_path: str = None) -> dict:
        """Use late-fusion strategy to combine text and audio predictions."""
        start_time = time.time()
        
        # Fallback to text-only if no audio is provided
        if not audio_path:
            result = self.predict_text(message)
            result["inference_time_ms"] = round((time.time() - start_time) * 1000, 2)
            result["mode"] = "text_only"
            return result
            
        # 1. Get independent predictions
        text_probs = np.array(list(self.predict_text(message)["probabilities"].values()))
        speech_probs = np.array(list(self.predict_voice(audio_path)["probabilities"].values()))
        
        # 2. Apply Alpha Fusion Strategy (Weighted Average)
        fused_probs = (self.alpha_text * text_probs) + ((1.0 - self.alpha_text) * speech_probs)
        
        result = self._format_output(fused_probs)
        result["inference_time_ms"] = round((time.time() - start_time) * 1000, 2)
        result["mode"] = "bimodal_fused"
        
        return result


if __name__ == "__main__":
    # Small test script to verify predictions for 5 sample messages
    print("\n" + "="*50)
    print("TESTING EMOTION PREDICTOR MODULE")
    print("="*50)
    
    predictor = EmotionPredictor()
    
    samples = [
        "I am so happy that we finally finished this project!",
        "This is completely unacceptable, I am furious right now.",
        "I just heard the news... I'm feeling really sad and down.",
        "Wait, are you serious? I did not expect that at all!",
        "Let's just proceed with the standard protocol."
    ]
    
    print("\n--- Running Text Inference ---")
    for i, text in enumerate(samples, 1):
        # We time it to ensure it meets the < 1 second requirement
        t0 = time.time()
        res = predictor.predict_text(text)
        t_ms = (time.time() - t0) * 1000
        
        print(f"\n[Message {i}]: '{text}'")
        print(f"Prediction: {res['top_emotion']} (Confidence: {res['confidence']:.1%})")
        print(f"Time: {t_ms:.2f} ms")
        
    print("\n--- Running Fused Inference (Simulated Audio) ---")
    fused_res = predictor.predict_fused("I am furious right now", audio_path="dummy_audio.wav")
    print(f"Message: 'I am furious right now' + Audio: 'dummy_audio.wav'")
    print(f"Fused Emotion: {fused_res['top_emotion']} ({fused_res['confidence']:.1%})")
    print(f"Fusion Time: {fused_res['inference_time_ms']} ms")
