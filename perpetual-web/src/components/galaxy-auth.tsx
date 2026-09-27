"use client";
import { useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Pause, Play, ShieldCheck } from "lucide-react";
import { GalaxyScene } from "./galaxy-scene";
import styles from "./galaxy.module.css";
export function GalaxyAuth({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  return (
    <section className={`${styles.auth} ${paused ? styles.paused : ""}`}>
      <div className={`shell ${styles.authGrid}`}>
        <div className={styles.authStory}>
          <Link className={`text-link ${styles.back}`} href="/">
            <ArrowLeft size={16} />
            Back to home
          </Link>
          <div className={styles.authIntro}>
            <span className={styles.eyebrow}>
              <span />
              Your Perpetual space
            </span>
            <h2>
              A world of <em>possibilities.</em>
            </h2>
            <p>
              Your people, projects, and next steps. All connected in one place.
            </p>
          </div>
          <div className={styles.authVisual}>
            <GalaxyScene />
          </div>
          <span className={styles.security}>
            <ShieldCheck size={16} />
            Your space at Perpetual Labs
          </span>
        </div>
        <div className={`auth-panel ${styles.panel}`}>{children}</div>
      </div>
      <div className={`shell ${styles.bottom}`}>
        <span>
          <a
            href="https://visibleearth.nasa.gov/images/57730/the-blue-marble-land-surface-ocean-color-and-sea-ice"
            target="_blank"
            rel="noopener noreferrer"
          >
            Earth imagery: NASA
          </a>{" "}
          · Artistic planet animation
        </span>
        <button
          type="button"
          className={styles.motion}
          aria-pressed={paused}
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
          {paused ? "Resume animation" : "Pause animation"}
        </button>
      </div>
    </section>
  );
}
