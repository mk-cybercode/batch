"use client";

import { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";

/**
 * Parallax image: drifts against scroll at `speed`, held at scale(1.12)
 * inside its clipping frame so edges never show. Desktop only (>=700px),
 * disabled for reduced motion — matching the original behaviour.
 */
export default function Parallax({
  src,
  alt = "",
  speed,
  loading,
}: {
  src: string;
  alt?: string;
  speed: number;
  loading?: "lazy" | "eager";
}) {
  const ref = useRef<HTMLImageElement>(null);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();
  const transform = useMotionValue("translateY(0px) scale(1.12)");

  const update = () => {
    if (!ref.current) return;
    if (reduce || !window.matchMedia("(min-width: 700px)").matches) {
      transform.set("none");
      return;
    }
    const vh = window.innerHeight;
    const r = ref.current.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const offset = (r.top + r.height / 2 - vh / 2) * -speed;
    transform.set(`translateY(${offset.toFixed(1)}px) scale(1.12)`);
  };

  useMotionValueEvent(scrollY, "change", update);
  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  return (
    <motion.img
      ref={ref}
      src={src}
      alt={alt}
      data-parallax={speed}
      loading={loading}
      style={{ transform }}
    />
  );
}
