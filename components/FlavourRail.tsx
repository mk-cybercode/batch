"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { flavours, photo } from "@/lib/site";

/**
 * Pinned horizontal flavour rail: the section is 340vh tall, the content
 * sticks, and vertical scroll drives the card track sideways with a thin
 * progress line underneath. Below 760px (or reduced motion) it degrades
 * to a native horizontal scroller.
 */
export default function FlavourRail() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [travel, setTravel] = useState(0);
  const [active, setActive] = useState(false);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  useEffect(() => {
    function measure() {
      const on = !reduce && window.matchMedia("(min-width: 761px)").matches;
      setActive(on);
      if (on && trackRef.current) {
        setTravel(
          trackRef.current.scrollWidth -
            window.innerWidth +
            window.innerWidth * 0.12
        );
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [reduce]);

  const x = useTransform(scrollYProgress, (p) => (active ? -travel * p : 0));
  const scaleX = useTransform(scrollYProgress, (p) => (active ? p : 0));

  return (
    <section className="rail" id="flavours" ref={sectionRef}>
      <div className="rail-sticky">
        <div className="rail-head">
          <div className="kicker-row">
            <span className="overline">The product</span>
            <span className="section-index">03 / 07</span>
          </div>
          <h2 className="display" style={{ marginTop: 14 }}>
            Eight flavours. No shortcuts.
          </h2>
        </div>
        <motion.div className="rail-track" ref={trackRef} style={{ x }}>
          {flavours.map((f) => (
            <div className="rail-card" key={f.img}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo(f.img)} alt={`${f.name} gelato`} loading="lazy" />
              <div className="veil"></div>
              <div className="lab">
                {f.name}
                <small>{f.sub}</small>
              </div>
            </div>
          ))}
          <div className="rail-card rail-card--cap">
            <p>
              Halaal certified.
              <br />
              Real ingredients.
              <br />
              <em>Made in small batches.</em>
            </p>
          </div>
        </motion.div>
        <div className="rail-progress" aria-hidden="true">
          <motion.i style={{ scaleX }} />
        </div>
      </div>
    </section>
  );
}
