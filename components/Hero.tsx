"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { asset, photo } from "@/lib/site";
import Parallax from "@/components/fx/Parallax";

/**
 * Full-height hero: staged entrance after the intro (overline → mark →
 * line → meta), slow settle of the background, and a fade-and-rise of the
 * content as the first viewport scrolls away.
 */
export default function Hero() {
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useMotionValue(0);
  const opacity = useMotionValue(1);

  useMotionValueEvent(scrollY, "change", (v) => {
    if (reduce) return;
    const vh = window.innerHeight;
    if (v < vh) {
      const p = v / vh;
      y.set(p * -60);
      opacity.set(Math.max(1 - p * 1.4, 0));
    }
  });

  return (
    <header className="hero" id="top">
      <div className="hero-bg" aria-hidden="true">
        <Parallax src={photo("salt-caramel")} speed={0.12} />
      </div>
      <div className="hero-scrim" aria-hidden="true"></div>
      <motion.div className="hero-content" style={{ y, opacity }}>
        <span className="overline" data-stage="1">
          Gelato made in small batches
        </span>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-mark"
          src={asset("/assets/batch-logo-cream.png")}
          alt="Batch. Gelato"
          data-stage="2"
        />
        <p className="hero-line" data-stage="3">
          Establishing a premium gelato brand at reduced risk, before scaling.
        </p>
        <div className="hero-meta" data-stage="4">
          <span>Investor information pack</span>
          <span className="dot"></span>
          <span>July 2026</span>
          <span className="dot"></span>
          <span>Cape Town</span>
        </div>
      </motion.div>
      <div className="scroll-cue" aria-hidden="true">
        Scroll
      </div>
    </header>
  );
}
