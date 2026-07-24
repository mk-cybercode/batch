import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import Parallax from "@/components/fx/Parallax";
import { photo } from "@/lib/site";

const cards = [
  {
    num: "01",
    title: "What",
    body: "Small-batch gelato made with Italian ingredients and equipment — machinery, flavour bases and a consulting chef through one supplier. Sold in 500ml tubs, with smaller cups for markets and events.",
  },
  {
    num: "02",
    title: "How it starts",
    body: "Production runs from a home kitchen on a single commercial machine — made in advance, frozen, and sold through four channels: direct online, Uber Eats, stockists and markets.",
  },
  {
    num: "03",
    title: "Where it goes",
    body: "A gelato & coffee store in a high foot-traffic location — and in time, a small group of stores supplied by one central kitchen.",
  },
];

export default function Concept() {
  return (
    <section
      className="section-pad"
      id="concept"
      style={{ paddingTop: "clamp(48px, 6vw, 80px)" }}
    >
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">The concept</span>
          <span className="section-index">01 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="Learn the craft. Prove the demand. Then build the brand." />
        </div>
        <div className="concept-grid">
          {cards.map((c, i) => (
            <div
              className="concept-card reveal"
              key={c.num}
              style={{ "--d": `${i * 110}ms` } as CSSProperties}
            >
              <span className="swatch" aria-hidden="true"></span>
              <span className="num">{c.num}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
        <div className="photo photo--wipe band-photo band-photo--narrow reveal">
          <Parallax
            src={photo("tubs-shared")}
            alt="Batch. gelato tubs shared around a table"
            speed={0.08}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
