"use client";
import { useState } from "react";

const EMOTIONS = ["Neutral","Surprise","Fear","Sadness","Joy","Disgust","Anger"];
const EMOJIS: Record<string,string> = {
  Neutral:"😐", Surprise:"😲", Fear:"😨", Sadness:"😢",
  Joy:"😄", Disgust:"🤢", Anger:"😡"
};
const COLORS: Record<string,string> = {
  Neutral:"#94a3b8", Surprise:"#f59e0b", Fear:"#a855f7",
  Sadness:"#3b82f6", Joy:"#22c55e", Disgust:"#10b981", Anger:"#ef4444"
};

type Score = { label:string; emoji:string; score:number; color:string };
type Result = { predicted:string; emoji:string; color:string; confidence:number; scores:Score[]; note?:string };

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!text.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) throw new Error("Server error: " + res.status);
      const data: Result = await res.json();
      setResult(data);

      // save to localStorage history
      const hist = JSON.parse(localStorage.getItem("emo_history") || "[]");
      hist.unshift({ text: text.trim(), result: data, at: Date.now() });
      localStorage.setItem("emo_history", JSON.stringify(hist.slice(0, 30)));
    } catch (e: any) {
      setError("Cannot reach backend. Make sure api_server.py is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) analyze();
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", padding:"40px 16px", display:"flex", flexDirection:"column", alignItems:"center" }}>

      {/* Header */}
      <header style={{ textAlign:"center", marginBottom:"40px" }}>
        <div style={{ display:"inline-flex", alignItems:"center", gap:"10px", marginBottom:"12px" }}>
          <span style={{ fontSize:"32px" }}>🧠</span>
          <h1 style={{ fontSize:"32px", fontWeight:700, letterSpacing:"-0.5px", color:"#f0f0ff" }}>
            Emo<span style={{ color:"#6c63ff" }}>Sense</span> AI
          </h1>
        </div>
        <p style={{ color:"var(--muted)", fontSize:"15px" }}>
          Bimodal Emotion Recognition · MELD Dataset · 7 Emotions
        </p>
      </header>

      {/* Main Card */}
      <div style={{
        width:"100%", maxWidth:"680px",
        background:"var(--card)", borderRadius:"20px",
        border:"1px solid var(--border)", padding:"32px",
        boxShadow:"0 24px 64px rgba(0,0,0,0.4)"
      }}>

        {/* Textarea */}
        <label style={{ display:"block", fontSize:"13px", color:"var(--muted)", marginBottom:"8px", fontWeight:500, letterSpacing:"0.05em" }}>
          INPUT TEXT
        </label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKey}
          rows={4}
          placeholder="Type a sentence or dialogue to analyze... (Ctrl+Enter to analyze)"
          style={{
            width:"100%", padding:"14px 16px", borderRadius:"12px",
            background:"#1e1e2e", border:"1px solid var(--border)",
            color:"var(--text)", fontSize:"15px", resize:"vertical",
            outline:"none", lineHeight:1.6,
            transition:"border-color 0.2s"
          }}
          onFocus={e => (e.target.style.borderColor = "#6c63ff")}
          onBlur={e => (e.target.style.borderColor = "var(--border)")}
        />

        {/* Button */}
        <button
          onClick={analyze}
          disabled={!text.trim() || loading}
          style={{
            marginTop:"14px", width:"100%", padding:"14px",
            borderRadius:"12px", border:"none", cursor: loading || !text.trim() ? "not-allowed" : "pointer",
            background: loading || !text.trim() ? "#2a2a3a" : "linear-gradient(135deg,#6c63ff,#00d4aa)",
            color: loading || !text.trim() ? "#555" : "#fff",
            fontWeight:600, fontSize:"15px", letterSpacing:"0.02em",
            transition:"all 0.2s"
          }}
        >
          {loading ? "⏳ Analyzing..." : "✨ Detect Emotion"}
        </button>

        {/* Error */}
        {error && (
          <div style={{ marginTop:"16px", padding:"12px 16px", background:"#2d1a1a", border:"1px solid #7f1d1d", borderRadius:"10px", color:"#fca5a5", fontSize:"13px" }}>
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{ marginTop:"24px" }}>
            {/* Primary prediction */}
            <div style={{
              padding:"20px", borderRadius:"14px",
              background:"#1e1e2e", border:"1px solid var(--border)",
              display:"flex", alignItems:"center", justifyContent:"space-between",
              marginBottom:"20px"
            }}>
              <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                <span style={{ fontSize:"48px" }}>{result.emoji}</span>
                <div>
                  <div style={{ fontSize:"11px", color:"var(--muted)", fontWeight:600, letterSpacing:"0.08em", marginBottom:"4px" }}>
                    DETECTED EMOTION
                  </div>
                  <div style={{ fontSize:"26px", fontWeight:700, color: result.color }}>
                    {result.predicted}
                  </div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontSize:"11px", color:"var(--muted)", fontWeight:600, letterSpacing:"0.08em", marginBottom:"4px" }}>
                  CONFIDENCE
                </div>
                <div style={{ fontSize:"28px", fontWeight:700, color:"var(--text)" }}>
                  {(result.confidence * 100).toFixed(0)}%
                </div>
              </div>
            </div>

            {/* Score bars */}
            <div style={{ fontSize:"11px", color:"var(--muted)", fontWeight:600, letterSpacing:"0.08em", marginBottom:"12px" }}>
              ALL EMOTION SCORES
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
              {result.scores.map(s => (
                <div key={s.label} style={{ display:"flex", alignItems:"center", gap:"10px", fontSize:"13px" }}>
                  <div style={{ width:"90px", display:"flex", justifyContent:"space-between", flexShrink:0, color: s.label === result.predicted ? "var(--text)" : "var(--muted)", fontWeight: s.label === result.predicted ? 600 : 400 }}>
                    <span>{s.label}</span>
                    <span>{s.emoji}</span>
                  </div>
                  <div style={{ flex:1, height:"6px", background:"#1e1e2e", borderRadius:"99px", overflow:"hidden" }}>
                    <div style={{
                      height:"100%", borderRadius:"99px",
                      background: s.color,
                      width:`${(s.score * 100).toFixed(1)}%`,
                      transition:"width 0.6s ease"
                    }}/>
                  </div>
                  <div style={{ width:"36px", textAlign:"right", color:"var(--muted)", flexShrink:0 }}>
                    {(s.score * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            {result.note && (
              <div style={{ marginTop:"16px", fontSize:"11px", color:"var(--muted)", textAlign:"center" }}>
                {result.note}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer style={{ marginTop:"40px", color:"var(--muted)", fontSize:"12px", textAlign:"center", lineHeight:1.8 }}>
        <p>Bimodal bcLSTM · MELD · 7 Emotion Classes</p>
        <p>Backend: Python FastAPI &nbsp;·&nbsp; Frontend: Next.js 16</p>
      </footer>
    </div>
  );
}
