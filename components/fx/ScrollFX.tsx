"use client";

import { useEffect } from "react";

/**
 * Scroll-linked reveal + count-up system, a faithful port of the original
 * page script: rect-based checks that survive throttled rAF, a failsafe
 * sweep, and JS-driven smooth anchor scrolling.
 */
export default function ScrollFX() {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- Reveal on scroll ---------- */
    let pending: HTMLElement[] = Array.prototype.slice.call(
      document.querySelectorAll(".reveal, .split, .photo--wipe")
    );
    function checkReveals() {
      if (!pending.length) return;
      const vh = window.innerHeight;
      const next: HTMLElement[] = [];
      for (const el of pending) {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("in");
        else next.push(el);
      }
      pending = next;
    }
    if (reduce) {
      pending.forEach((el) => el.classList.add("in"));
      pending = [];
    }

    /* ---------- Count-up metrics ---------- */
    type Opts = {
      value: number;
      decimals: number;
      prefix: string;
      suffix: string;
      group: boolean;
      locale: string;
    };
    function formatNum(v: number, opts: Opts) {
      let s: string | number = v.toFixed(opts.decimals);
      if (opts.group) s = Number(s).toLocaleString(opts.locale);
      return opts.prefix + s + opts.suffix;
    }
    function counterOpts(el: HTMLElement): Opts {
      return {
        value: parseFloat(el.getAttribute("data-value") || "0"),
        decimals: parseInt(el.getAttribute("data-decimals") || "0", 10),
        prefix: el.getAttribute("data-prefix") || "",
        suffix: el.getAttribute("data-suffix") || "",
        group: el.hasAttribute("data-group"),
        locale: el.getAttribute("data-locale") || "en-ZA",
      };
    }
    let counters: HTMLElement[] = Array.prototype.slice.call(
      document.querySelectorAll("[data-count]")
    );
    /* Markup carries the final values; zero them out only when animating. */
    if (!reduce) {
      counters.forEach((el) => {
        el.textContent = formatNum(0, counterOpts(el));
      });
    }
    function runCounter(el: HTMLElement) {
      const opts = counterOpts(el);
      if (reduce) {
        el.textContent = formatNum(opts.value, opts);
        return;
      }
      let start: number | null = null;
      const dur = 1400;
      let done = false;
      function tick(t: number) {
        if (done) return;
        if (!start) start = t;
        const p = Math.min((t - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = formatNum(opts.value * eased, opts);
        if (p < 1) requestAnimationFrame(tick);
        else done = true;
      }
      requestAnimationFrame(tick);
      setTimeout(() => {
        if (!done) {
          done = true;
          el.textContent = formatNum(opts.value, opts);
        }
      }, dur + 700);
    }
    function checkCounters() {
      if (!counters.length) return;
      const vh = window.innerHeight;
      const next: HTMLElement[] = [];
      for (const el of counters) {
        const r = el.getBoundingClientRect();
        if (r.top < vh * 0.9 && r.bottom > 0) runCounter(el);
        else next.push(el);
      }
      counters = next;
    }
    if (reduce) {
      counters.forEach(runCounter);
      counters = [];
    }

    function onScroll() {
      checkReveals();
      checkCounters();
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    /* Failsafe sweep for anything a missed scroll event left hidden */
    const sweep = window.setInterval(() => {
      checkReveals();
      checkCounters();
      if (!pending.length && !counters.length) window.clearInterval(sweep);
    }, 350);

    /* ---------- Smooth anchor scrolling ---------- */
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement).closest?.(
        'a[href^="#"]'
      ) as HTMLAnchorElement | null;
      if (!a) return;
      const target = document.querySelector(a.getAttribute("href") || "");
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    }
    document.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.clearInterval(sweep);
      document.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
