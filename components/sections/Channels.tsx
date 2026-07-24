import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import Parallax from "@/components/fx/Parallax";
import { photo } from "@/lib/site";

const channels = [
  {
    variant: "chan--margin",
    role: "Margin",
    title: "Online & social",
    body: "Highest margin — no commission. The 500ml tub and 3-pack, delivered. Builds the audience and following the store will later depend on.",
  },
  {
    variant: "chan--volume",
    role: "Volume",
    title: "Uber Eats",
    body: "Immediate reach into a large base. Listed prices absorb the platform commission, so the amount received remains R190. Cold chain handled with dry ice.",
  },
  {
    variant: "chan--volume",
    role: "Visibility",
    title: "Stockists",
    body: "Wholesale at ≈ R125 — lower margin, but steady baseline volume and shelf presence. Branded freezers placed as it scales.",
  },
  {
    variant: "chan--margin",
    role: "Brand",
    title: "Markets & events",
    body: "Markets are the shop window; events are the best use of capacity — a 150-serving booking returns roughly R5,000 in profit.",
  },
];

export default function Channels() {
  return (
    <section className="section-pad section--sunken" id="channels">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">The channels</span>
          <span className="section-index">05 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="Four ways to sell. One tub." />
          <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
            Each channel reaches a different customer. Markets function
            primarily as a brand-building channel — revenue is driven by tub
            sales, stockists and events.
          </p>
        </div>
        <div className="chan-grid">
          {channels.map((c, i) => (
            <div
              className={`chan ${c.variant} reveal`}
              key={c.title}
              style={{ "--d": `${i * 90}ms` } as CSSProperties}
            >
              <span className="chan-role">{c.role}</span>
              <h4>{c.title}</h4>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
        <div className="photo photo--wipe band-photo reveal">
          <Parallax
            src={photo("packaging-tubs")}
            alt="Batch. tub packaging across the flavour range"
            speed={0.08}
            loading="lazy"
          />
          <span className="caption-chip">Shelf-ready — simple tubs, healthy margins</span>
        </div>
        <p className="chan-note reveal">
          Direct and events carry the <em>margin</em>. Platform and stockists
          carry the <em>volume</em>. Markets build the <em>brand</em>.
        </p>
      </div>
    </section>
  );
}
