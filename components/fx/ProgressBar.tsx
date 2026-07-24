"use client";

import { motion, useScroll } from "framer-motion";

/** Thin pistachio scroll-progress line pinned to the top of the viewport. */
export default function ProgressBar() {
  const { scrollYProgress } = useScroll();
  return (
    <div className="progress" aria-hidden="true">
      <motion.span style={{ scaleX: scrollYProgress }} />
    </div>
  );
}
