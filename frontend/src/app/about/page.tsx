export default function About() {
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">About the Model</h1>
      
      <div className="card p-6 space-y-4 prose prose-invert max-w-none text-[var(--text-primary)]">
        <p>
          <strong>EmoSense AI</strong> is powered by a state-of-the-art Deep Learning model designed to understand human emotions from conversational text.
        </p>

        <h3 className="text-xl font-semibold mt-6 border-b border-[var(--border)] pb-2">1. Architecture (bcLSTM)</h3>
        <p className="text-[var(--text-secondary)]">
          The core model is a <strong>Bimodal Contextual Long Short-Term Memory (bcLSTM)</strong> network. It is designed to capture not just the meaning of isolated sentences, but the contextual flow of a conversation. It utilizes an Attention Mechanism to focus on the most emotionally significant parts of a dialogue sequence.
        </p>

        <h3 className="text-xl font-semibold mt-6 border-b border-[var(--border)] pb-2">2. Dataset (MELD)</h3>
        <p className="text-[var(--text-secondary)]">
          The model was trained on the <strong>Multimodal EmotionLines Dataset (MELD)</strong>, which contains thousands of utterances from the TV show <em>Friends</em>. It supports classification across 7 distinct emotion categories:
        </p>
        <ul className="list-disc pl-5 text-[var(--text-secondary)] grid grid-cols-2 gap-2 mt-2">
          <li><span className="text-[#64748b]">Neutral</span></li>
          <li><span className="text-[#f59e0b]">Surprise</span></li>
          <li><span className="text-[#8b5cf6]">Fear</span></li>
          <li><span className="text-[#3b82f6]">Sadness</span></li>
          <li><span className="text-[#f59e0b]">Joy</span></li>
          <li><span className="text-[#10b981]">Disgust</span></li>
          <li><span className="text-[#ef4444]">Anger</span></li>
        </ul>

        <h3 className="text-xl font-semibold mt-6 border-b border-[var(--border)] pb-2">3. Handling Imbalanced Data</h3>
        <p className="text-[var(--text-secondary)]">
          To improve the detection of minority classes like <em>Fear</em> and <em>Disgust</em>, the training pipeline utilizes sequence-level data oversampling and SMOTE-inspired class weighting, ensuring the AI does not simply default to "Neutral" for ambiguous inputs.
        </p>
      </div>
    </div>
  );
}
