import type { CSSProperties } from "react";
import Parallax from "@/components/fx/Parallax";
import { photo } from "@/lib/site";

const formats = [
  { name: "500ml tub", price: "R190" },
  { name: "3-pack · 3 × 175ml", price: "R195" },
  { name: "175ml cup", price: "R65" },
  { name: "Event package · 150 servings", price: "R10,500" },
];

export default function ProductFeature() {
  return (
    <section className="section-pad">
      <div className="split-feature">
        <div className="photo photo--wipe reveal">
          <Parallax
            src={photo("cup-cone-pair")}
            alt="Batch. gelato served in a cup and a cone"
            speed={0.08}
          />
        </div>
        <div>
          <span className="overline reveal">Products and pricing</span>
          <h3 className="reveal" style={{ "--d": "100ms" } as CSSProperties}>
            Three retail formats plus an event service.
          </h3>
          <p className="reveal" style={{ "--d": "180ms" } as CSSProperties}>
            500ml for home consumption and smaller cups for markets and events.
            The 500ml tub uses polystyrene, some of which is imported from
            Italy — it retains the temperature of the gelato for longer, which
            makes delivery easier and reduces melting in transit. The 3-pack
            and 175ml cups are locally sourced.
          </p>
          <ul className="formats reveal" style={{ "--d": "260ms" } as CSSProperties}>
            {formats.map((f) => (
              <li key={f.name}>
                {f.name}
                {f.price && <span>{f.price}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
