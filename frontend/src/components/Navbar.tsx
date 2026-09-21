"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  
  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          EmoSense <span className="text-[var(--accent)]">AI</span>
        </Link>
        <div className="flex space-x-6">
          <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>Home</Link>
          <Link href="/history" className={`nav-link ${pathname === "/history" ? "active" : ""}`}>History</Link>
          <Link href="/about" className={`nav-link ${pathname === "/about" ? "active" : ""}`}>About Model</Link>
        </div>
      </div>
    </nav>
  );
}
