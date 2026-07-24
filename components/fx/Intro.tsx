"use client";

import { useEffect, useState } from "react";
import { asset } from "@/lib/site";

export const LOADED_EVENT = "batch:loaded";

/**
 * Intro overlay: the Batch. mark rises in on licorice, then the overlay
 * fades to reveal the hero. Adds `is-loaded` to <body>, which drives the
 * staged hero entrance and the slow background zoom.
 */
export default function Intro() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let fired = false;
    const timers: number[] = [];
    function begin() {
      if (fired) return;
      fired = true;
      document.body.classList.add("is-loaded");
      setDone(true);
      window.dispatchEvent(new Event(LOADED_EVENT));
    }
    if (reduce) {
      begin();
    } else {
      if (document.readyState === "complete") {
        timers.push(window.setTimeout(begin, 650));
      } else {
        window.addEventListener(
          "load",
          () => timers.push(window.setTimeout(begin, 650)),
          { once: true }
        );
      }
      timers.push(window.setTimeout(begin, 2400));
    }
    return () => timers.forEach(window.clearTimeout);
  }, []);

  return (
    <div className={`intro${done ? " is-done" : ""}`} aria-hidden="true">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={asset("/assets/batch-logo-cream.png")} alt="" />
    </div>
  );
}
