"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ArrowDown, Pause, Play } from "lucide-react";
export function GalaxyHero({
  galaxy,
  earth,
  credit,
  source,
  copy,
}: {
  copy: { eyebrow: string; title: string; description: string };
  galaxy: string | null;
  earth: string | null;
  credit: string;
  source: string | null;
}) {
  const [paused, setPaused] = useState(false);
  return (
    <section className={`cosmos-hero ${paused ? "cosmos-paused" : ""}`}>
      <GalaxyScene galaxy={galaxy} earth={earth} />
      <div className="shell cosmos-content">
        <div className="cosmos-copy">
          <span className="eyebrow">
            <span className="signal-dot" />
            {copy.eyebrow}
          </span>
          <h1 className="preserve-lines">
            {copy.title.split("\n").map((line, i, lines) =>
              i === lines.length - 1 ? (
                <span key={i}>{line}</span>
              ) : (
                <span className="hero-title-line" key={i}>
                  {line}
                  <br />
                </span>
              ),
            )}
          </h1>
          <p className="preserve-lines">{copy.description}</p>
          <div className="hero-actions">
            <Link className="button" href="/contact">
              Let’s build something <ArrowUpRight size={19} />
            </Link>
            <Link className="text-link" href="#products">
              Explore our products <ArrowDown size={18} />
            </Link>
          </div>
        </div>
        <div className="cosmos-caption">
          <span>01 / A universe of possibility</span>
          <span>Thoughtful technology. Real-world impact.</span>
        </div>
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
          {paused ? <Play size={14} /> : <Pause size={14} />}{" "}
          {paused ? "Resume animation" : "Pause animation"}
        </button>
      </div>
    </section>
  );
}

export function GalaxyScene({
  galaxy,
  earth,
}: {
  galaxy: string | null;
  earth: string | null;
}) {
  return (
    <div className="cosmos-scene" aria-hidden="true">
      {galaxy && (
        <Image
          className="cosmos-galaxy"
          src={galaxy}
          alt=""
          fill
          priority
          unoptimized
          sizes="100vw"
        />
      )}
      <div className="cosmos-veil" />
      <div className="cosmos-stars" />
      <div className="planet-system">
        <div className="planet-path path-outer" />
        <div className="planet-path path-inner" />
        <div className="earth-position">
          <div
            className="planet earth"
            style={earth ? { backgroundImage: `url("${earth}")` } : undefined}
          />
          <span className="earth-halo" />
        </div>
        <div className="planet-track track-one">
          <div className="planet gas-planet">
            <span className="saturn-ring" />
          </div>
        </div>
        <div className="planet-track track-two">
          <div className="planet copper-planet" />
        </div>
        <div className="planet-track track-three">
          <div className="planet ice-planet" />
        </div>
      </div>
    </div>
  );
}
