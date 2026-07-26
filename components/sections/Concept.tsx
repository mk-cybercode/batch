import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import Parallax from "@/components/fx/Parallax";
import { photo } from "@/lib/site";

const cards = [
  {
    num: "01",
    title: "What it is",
    body: "BATCH. intends to produce gelato in small batches and sell it directly to the public and to retailers. The recipes, machinery and flavour bases are sourced from Italy through a single South African supplier, which also provides equipment training and access to a consulting chef for recipe development.",
  },
  {
    num: "02",
    title: "How it operates",
    body: "Production takes place in a home kitchen on one commercial batch freezer. Gelato is made in advance, frozen, and sold over the following weeks — it is not made to daily order. Production is scheduled into evenings and weekends rather than tied to trading hours.",
  },
  {
    num: "03",
    title: "Where it is going",
    body: "The long-term objective is a gelato and coffee store, and ultimately a group of stores supplied by one central kitchen. The business starts at a modest scale with the ambition of scaling into a substantial brand.",
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
          <span className="overline">The business</span>
          <span className="section-index">01 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="Establishing a premium gelato brand at reduced risk, before scaling." />
          <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
            Gelato is a more premium product than ice cream — it is churned at a
            slower speed and served at a slightly warmer temperature, which
            gives a denser texture and a more intense flavour.
          </p>
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
            alt="Batch. gelato tubs and flavours"
            speed={0.08}
            loading="lazy"
          />
        </div>
      </div>
    </section>
  );
}
