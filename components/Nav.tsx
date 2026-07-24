"use client";

import { useEffect, useRef, useState } from "react";
import { asset, CONTACT } from "@/lib/site";
import { LOADED_EVENT } from "@/components/fx/Intro";

const links = [
  { href: "#concept", label: "Concept" },
  { href: "#why", label: "Model" },
  { href: "#flavours", label: "Flavours" },
  { href: "#economics", label: "Economics" },
  { href: "#channels", label: "Channels" },
  { href: "#vision", label: "Vision" },
  { href: "#ask", label: "The ask" },
];

/**
 * Sticky nav: slides in after the intro, gains a hairline border on
 * scroll, highlights the active section, and collapses into an animated
 * mobile menu below 900px.
 */
export default function Nav() {
  const [ready, setReady] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (
      document.body.classList.contains("is-loaded") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setReady(true);
    }
    const onLoaded = () => setReady(true);
    window.addEventListener(LOADED_EVENT, onLoaded);

    function onScroll() {
      setScrolled(window.scrollY > 40);
      /* Scroll-spy: the last section whose top has passed a third of the viewport */
      const pos = window.scrollY + window.innerHeight * 0.32;
      let current: string | null = null;
      for (const l of links) {
        const el = document.getElementById(l.href.slice(1));
        if (el && el.offsetTop <= pos) current = l.href;
      }
      setActive(current);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();

    function onDocClick(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".nav")) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(LOADED_EVENT, onLoaded);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className={`nav${ready ? " is-ready" : ""}${scrolled ? " is-scrolled" : ""}${open ? " open" : ""}`}
      aria-label="Main"
    >
      <div className="nav-inner">
        <a className="nav-logo" href="#top" aria-label="Batch. — back to top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/assets/batch-logo-black.png")} alt="Batch." />
        </a>
        <div className="nav-links" id="navLinks" onClick={() => setOpen(false)}>
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={active === l.href ? "active" : undefined}
            >
              {l.label}
            </a>
          ))}
          <a
            className="nav-contact-m"
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener"
          >
            WhatsApp us · {CONTACT.phone}
          </a>
        </div>
        <div className="nav-cta">
          <a
            className="btn btn--dark nav-contact"
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener"
          >
            Contact
          </a>
          <button
            className="nav-toggle"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="navLinks"
            onClick={() => setOpen((v) => !v)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}
