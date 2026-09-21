import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300","400","500","600","700","800","900"] });

export const metadata: Metadata = {
  title: "EmoSense AI - Multimodal Emotion Recognition",
  description: "Detect emotions from text and audio using advanced AI (Bimodal bcLSTM model trained on MELD dataset)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
