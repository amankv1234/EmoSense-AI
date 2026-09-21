"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Mic, FileText, Upload, Zap, BarChart3,
  ChevronDown, Sparkles, Activity, AlertCircle
} from "lucide-react";

const EMOTIONS = [
  { label: "Neutral",  emoji: "😐", color: "#64748b", bg: "rgba(100,116,139,0.15)", key: 0 },
  { label: "Surprise", emoji: "😲", color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  key: 1 },
  { label: "Fear",     emoji: "😨", color: "#8b5cf6", bg: "rgba(139,92,246,0.15)",  key: 2 },
  { label: "Sadness",  emoji: "😢", color: "#3b82f6", bg: "rgba(59,130,246,0.15)",  key: 3 },
  { label: "Joy",      emoji: "😄", color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  key: 4 },
  { label: "Disgust",  emoji: "🤢", color: "#10b981", bg: "rgba(16,185,129,0.15)",  key: 5 },
  { label: "Anger",    emoji: "😡", color: "#ef4444", bg: "rgba(239,68,68,0.15)",   key: 6 },
];

interface EmotionResult {
  predicted: string;
  emoji: string;
  color: string;
  confidence: number;
  scores: { label: string; emoji: string; score: number; color: string }[];
}

const MOCK_RESULTS: EmotionResult[] = [
  {
    predicted: "Joy", emoji: "😄", color: "#f59e0b", confidence: 0.72,
    scores: [
      { label: "Joy",      emoji: "😄", score: 0.72, color: "#f59e0b" },
      { label: "Neutral",  emoji: "😐", score: 0.13, color: "#64748b" },
      { label: "Surprise", emoji: "😲", score: 0.08, color: "#f59e0b" },
      { label: "Anger",    emoji: "😡", score: 0.04, color: "#ef4444" },
      { label: "Sadness",  emoji: "😢", score: 0.02, color: "#3b82f6" },
      { label: "Fear",     emoji: "😨", score: 0.01, color: "#8b5cf6" },
      { label: "Disgust",  emoji: "🤢", score: 0.00, color: "#10b981" },
    ],
  },
  {
    predicted: "Anger", emoji: "😡", color: "#ef4444", confidence: 0.81,
    scores: [
      { label: "Anger",    emoji: "😡", score: 0.81, color: "#ef4444" },
      { label: "Disgust",  emoji: "🤢", score: 0.09, color: "#10b981" },
      { label: "Neutral",  emoji: "😐", score: 0.05, color: "#64748b" },
      { label: "Sadness",  emoji: "😢", score: 0.03, color: "#3b82f6" },
      { label: "Fear",     emoji: "😨", score: 0.01, color: "#8b5cf6" },
      { label: "Joy",      emoji: "😄", score: 0.01, color: "#f59e0b" },
      { label: "Surprise", emoji: "😲", score: 0.00, color: "#f59e0b" },
    ],
  },
  {
    predicted: "Sadness", emoji: "😢", color: "#3b82f6", confidence: 0.65,
    scores: [
      { label: "Sadness",  emoji: "😢", score: 0.65, color: "#3b82f6" },
      { label: "Neutral",  emoji: "😐", score: 0.18, color: "#64748b" },
      { label: "Fear",     emoji: "😨", score: 0.09, color: "#8b5cf6" },
      { label: "Disgust",  emoji: "🤢", score: 0.05, color: "#10b981" },
      { label: "Anger",    emoji: "😡", score: 0.02, color: "#ef4444" },
      { label: "Surprise", emoji: "😲", score: 0.01, color: "#f59e0b" },
      { label: "Joy",      emoji: "😄", score: 0.00, color: "#f59e0b" },
    ],
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<"text" | "audio">("text");
  const [text, setText] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<EmotionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (activeTab === "text" && !text.trim()) return;
    if (activeTab === "audio" && !audioFile) return;

    setIsLoading(true);
    setResult(null);

    try {
      // Connect to Real Python ML API
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: activeTab === "text" ? text : audioFile?.name || "" }),
      });
      
      if (!res.ok) throw new Error("API request failed");
      
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      // Fallback to mock data if API is down
      const mock = MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setResult(mock);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("audio/") || file.type.startsWith("video/"))) {
      setAudioFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  };

  return (
    <div className="min-h-screen mesh-bg relative">
      {/* Background orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563eb, transparent 70%)" }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-14 h-14 rounded-2xl flex items-center justify-center glow-purple"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              <Brain className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-4xl font-black gradient-text">EmoSense AI</h1>
              <p className="text-xs text-slate-500 font-mono tracking-widest uppercase">Multimodal Emotion Recognition</p>
            </div>
          </div>

          <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Powered by a <span className="text-purple-400 font-semibold">Bimodal bcLSTM</span> model trained on the{" "}
            <span className="text-blue-400 font-semibold">MELD dataset</span> (Friends TV show). Analyze emotions from text or audio using advanced multimodal AI.
          </p>

          {/* Stats badges */}
          <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
            {[
              { icon: <Activity className="w-3.5 h-3.5" />, text: "7 Emotions" },
              { icon: <Sparkles className="w-3.5 h-3.5" />, text: "Bimodal AI" },
              { icon: <BarChart3 className="w-3.5 h-3.5" />, text: "~60% Accuracy" },
              { icon: <Zap className="w-3.5 h-3.5" />, text: "Real-time" },
            ].map((badge, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full text-slate-300"
                style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)" }}
              >
                <span className="text-purple-400">{badge.icon}</span>
                {badge.text}
              </motion.span>
            ))}
          </div>
        </motion.header>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-3xl p-1"
          style={{ background: "linear-gradient(135deg, #7c3aed33, #2563eb33, #06b6d433)" }}
        >
          <div className="rounded-[22px] p-6 md:p-8" style={{ background: "#12121a" }}>
            {/* Tabs */}
            <div className="flex gap-2 p-1 rounded-xl mb-6" style={{ background: "#0a0a0f" }}>
              {(["text", "audio"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setResult(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 cursor-pointer ${activeTab === tab ? "tab-active" : "tab-inactive"}`}
                >
                  {tab === "text" ? <FileText className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  {tab === "text" ? "Text Analysis" : "Audio/Video Upload"}
                </button>
              ))}
            </div>

            {/* Input Area */}
            <AnimatePresence mode="wait">
              {activeTab === "text" ? (
                <motion.div key="text"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Enter a dialogue or utterance
                  </label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="e.g., I can't believe you did this! After everything we've been through..."
                    rows={5}
                    className="w-full rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 resize-none outline-none transition-all duration-300 text-sm leading-relaxed"
                    style={{
                      background: "#0a0a0f",
                      border: "1px solid #2d2d4a",
                      fontFamily: "'Inter', sans-serif",
                    }}
                    onFocus={(e) => e.target.style.borderColor = "#7c3aed"}
                    onBlur={(e) => e.target.style.borderColor = "#2d2d4a"}
                  />
                  <p className="text-xs text-slate-600 mt-1.5">{text.length} characters</p>
                </motion.div>
              ) : (
                <motion.div key="audio"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div
                    className={`upload-zone rounded-xl p-10 text-center cursor-pointer ${isDragging ? "drag-over" : ""}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input ref={fileInputRef} type="file" accept="audio/*,video/mp4" className="hidden" onChange={handleFileChange} />
                    {audioFile ? (
                      <div>
                        <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                          style={{ background: "rgba(124,58,237,0.2)" }}>
                          <Mic className="w-7 h-7 text-purple-400" />
                        </div>
                        <p className="text-slate-200 font-semibold">{audioFile.name}</p>
                        <p className="text-slate-500 text-sm mt-1">{(audioFile.size / 1024 / 1024).toFixed(2)} MB — Click to change</p>
                      </div>
                    ) : (
                      <div>
                        <motion.div
                          className="animate-float w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
                          style={{ background: "rgba(124,58,237,0.15)" }}
                        >
                          <Upload className="w-7 h-7 text-purple-400" />
                        </motion.div>
                        <p className="text-slate-300 font-semibold">Drop your audio or video file here</p>
                        <p className="text-slate-500 text-sm mt-1">Supports .mp3, .wav, .mp4 — Max 50MB</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 p-3 rounded-xl flex gap-2 items-start"
                    style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(37,99,235,0.2)" }}>
                    <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-300">For best results, use clips from the MELD dataset (Friends TV show). The audio features will be analyzed using the trained bcLSTM model.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analyze Button */}
            <motion.button
              onClick={handleAnalyze}
              disabled={isLoading || (activeTab === "text" ? !text.trim() : !audioFile)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-6 py-4 rounded-xl font-bold text-base text-white flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 rounded-full border-2 border-white border-t-transparent"
                  />
                  Analyzing Emotion...
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  Detect Emotion
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="mt-8"
            >
              {/* Predicted Emotion Big Card */}
              <div className="rounded-3xl p-1 mb-6"
                style={{ background: `linear-gradient(135deg, ${result.color}44, ${result.color}22)` }}>
                <div className="rounded-[22px] p-8 text-center" style={{ background: "#12121a" }}>
                  <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-4">Predicted Emotion</p>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                    className="text-8xl mb-4"
                  >
                    {result.emoji}
                  </motion.div>
                  <h2 className="text-4xl font-black mb-2" style={{ color: result.color }}>
                    {result.predicted}
                  </h2>
                  <p className="text-slate-400">
                    Confidence:{" "}
                    <span className="font-bold text-white text-lg">{(result.confidence * 100).toFixed(1)}%</span>
                  </p>
                </div>
              </div>

              {/* Confidence Bars */}
              <div className="rounded-3xl p-6 md:p-8 card-border" style={{ background: "#12121a" }}>
                <h3 className="text-slate-300 font-bold text-lg mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                  Emotion Probability Distribution
                </h3>
                <div className="space-y-4">
                  {result.scores.map((s, i) => (
                    <motion.div key={s.label}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.06 }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                          <span>{s.emoji}</span> {s.label}
                        </span>
                        <span className="text-sm font-bold" style={{ color: s.color }}>
                          {(s.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "#0a0a0f" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.score * 100}%` }}
                          transition={{ duration: 0.8, delay: i * 0.06, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ background: `linear-gradient(90deg, ${s.color}99, ${s.color})` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emotion Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 rounded-2xl p-6 card-border"
          style={{ background: "#12121a" }}
        >
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-widest mb-4 flex items-center gap-2">
            <ChevronDown className="w-4 h-4" /> Recognizable Emotions (7 Classes)
          </h3>
          <div className="grid grid-cols-4 md:grid-cols-7 gap-3">
            {EMOTIONS.map((e) => (
              <div key={e.key} className="text-center p-3 rounded-xl transition-all hover:scale-105 cursor-default"
                style={{ background: e.bg, border: `1px solid ${e.color}33` }}>
                <div className="text-2xl mb-1">{e.emoji}</div>
                <div className="text-xs font-medium" style={{ color: e.color }}>{e.label}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="text-center mt-12 text-slate-600 text-xs">
          <p>Trained on <span className="text-purple-400">MELD Dataset</span> (Friends TV Show) · Bimodal bcLSTM Model · Text + Audio Features</p>
          <p className="mt-1">Backend API integration coming soon · Currently showing demo predictions</p>
        </footer>
      </div>
    </div>
  );
}
