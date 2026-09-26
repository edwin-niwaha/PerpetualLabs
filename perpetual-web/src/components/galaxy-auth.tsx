"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play, ShieldCheck } from "lucide-react";
import { GalaxyScene } from "./galaxy-hero";

export function GalaxyAuth({
  galaxy,
  earth,
  credit,
  source,
  children,
}: {
  galaxy: string | null;
  earth: string | null;
  credit: string;
  source: string | null;
  children: ReactNode;
}) {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={`cosmos-hero galaxy-auth ${paused ? "cosmos-paused" : ""}`}
    >
      <GalaxyScene galaxy={galaxy} earth={earth} />
      <div className="shell galaxy-auth-grid">
        <div className="galaxy-auth-story">
          <Link className="text-link auth-back" href="/">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <div>
            <span className="eyebrow">
              <span className="signal-dot" /> A universe of possibility
            </span>
            <h2>
              Back in
              <br /> your <em>orbit.</em>
            </h2>
            <p>
              Your ideas. Your people. Your next chapter.
              <br />
              Good to have you back in the loop.
            </p>
          </div>
          <span className="auth-security">
            <ShieldCheck size={17} /> Your space at Perpetual Labs
          </span>
        </div>
        <div className="auth-panel galaxy-auth-panel">{children}</div>
      </div>
      <div className="shell cosmos-bottom">
        <div className="cosmos-credit">
          {source && (
            <a
              href={source}
              target="_blank"
              rel="noopener noreferrer"
              title={credit}
            >
              M51 galaxy / Hubble photography ↗
            </a>
          )}
          <span>Planet animation is an artistic composition.</span>
        </div>
        <button
          type="button"
          className="motion-toggle"
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? "Resume animation" : "Pause animation"}
        </button>
      </div>
    </section>
  );
}
