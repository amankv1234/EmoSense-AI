"use client";
import { useEffect, useState } from "react";

export default function History() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("emosense_history") || "[]");
    setHistory(saved);
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Detection History</h1>
        <p className="text-[var(--text-secondary)] mt-1">Your recent predictions are saved locally in your browser.</p>
      </div>

      {history.length === 0 ? (
        <div className="card p-8 text-center text-[var(--text-secondary)]">
          No history found. Go to the Home page to detect some emotions!
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item, idx) => (
            <div key={idx} className="card p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <p className="text-[var(--text-secondary)] text-xs mb-1">{new Date(item.date).toLocaleString()}</p>
                <p className="text-[var(--text-primary)]">"{item.text}"</p>
              </div>
              <div className="flex items-center space-x-2 bg-[var(--bg-secondary)] px-4 py-2 rounded-lg border border-[var(--border)]">
                <span className="text-2xl">{item.result.emoji}</span>
                <span className="font-bold" style={{ color: item.result.color }}>{item.result.predicted}</span>
                <span className="text-sm text-[var(--text-secondary)] ml-2">{(item.result.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
