import type { CSSProperties } from "react";
import Parallax from "@/components/fx/Parallax";
import { photo } from "@/lib/site";

const formats = [
  { name: "500ml tub", price: "R190" },
  { name: "3-pack · 3 × 175ml", price: "R195" },
  { name: "175ml cup", price: "R65" },
  { name: "Event package", price: "" },
];

export default function ProductFeature() {
  return (
    <section className="section-pad">
      <div className="split-feature">
        <div className="photo photo--wipe reveal">
          <Parallax
            src={photo("cup-and-cone")}
            alt="A Batch. gelato cup and cone, held side by side"
            speed={0.08}
          />
        </div>
        <div>
          <span className="overline reveal">Four formats</span>
          <h3 className="reveal" style={{ "--d": "100ms" } as CSSProperties}>
            A scoop now. A tub for later.
          </h3>
          <p className="reveal" style={{ "--d": "180ms" } as CSSProperties}>
            The 500ml tub is the core product — with 3-packs of three flavours
            online, single-serve cups at markets and events, and an event
            package with gelato, staff and serving equipment supplied.
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
