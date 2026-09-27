"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDown, Pause, Play } from "lucide-react";
import { GalaxyScene } from "./galaxy-scene";
import styles from "./galaxy.module.css";
export function GalaxyHero({
  copy,
}: {
  copy: { eyebrow: string; title: string; description: string };
}) {
  const [paused, setPaused] = useState(false);
  return (
    <section
      className={`${styles.hero} ${paused ? styles.paused : ""}`}
      aria-labelledby="home-title"
    >
      <div className={`shell ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>
            <span />
            {copy.eyebrow}
          </span>
          <h1 id="home-title">
            {copy.title.split("\n").map((line, index, lines) => (
              <span
                className={
                  index === lines.length - 1 ? styles.accent : undefined
                }
                key={index}
              >
                {line}
              </span>
            ))}
          </h1>
          <p>{copy.description}</p>
          <div className={styles.actions}>
            <Link className="button" href="/contact">
              Let’s build something <ArrowUpRight size={18} />
            </Link>
            <Link className="text-link" href="#products">
              Explore our work <ArrowDown size={17} />
            </Link>
          </div>
          <div className={styles.disciplines}>
            <span>Websites</span>
            <span>Software</span>
            <span>Connected systems</span>
          </div>
        </div>
        <figure className={styles.heroVisual}>
          <GalaxyScene />
          <figcaption>
            <span>A world of possibilities.</span>
            <span>Built around people.</span>
          </figcaption>
        </figure>
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
