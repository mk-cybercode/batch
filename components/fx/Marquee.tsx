"use client";

import { Fragment, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

/**
 * Scroll-driven marquee — the outlined display text drifts horizontally
 * with page scroll (speed < 0 moves left as you scroll down).
 */
export default function Marquee({
  text,
  speed,
  variant = "ghost",
}: {
  text: string;
  speed: number;
  variant?: "ghost" | "dark";
}) {
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const x = useMotionValue(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    if (reduce || !track.current) return;
    x.set((y * speed) % (track.current.scrollWidth / 2));
  });

  return (
    <div className={`marquee marquee--${variant}`} aria-hidden="true">
      <motion.div ref={track} className="marquee-track" style={{ x }}>
        {[0, 1, 2].map((i) => (
          <Fragment key={i}>
            <span>{text}</span>
            <span className="sep">•</span>
          </Fragment>
        ))}
      </motion.div>
    </div>
  );
}
