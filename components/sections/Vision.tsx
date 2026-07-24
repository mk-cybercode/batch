import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import Parallax from "@/components/fx/Parallax";
import { photo } from "@/lib/site";

const streams = [
  { label: "Coffee — year-round, daily frequency", pct: "~75%", w: 0.75, d: 0 },
  { label: "Gelato — the signature", pct: "~63%", w: 0.63, d: 130 },
  { label: "Desserts & waffles — basket value", pct: "~60%", w: 0.6, d: 260 },
];

const towns = [
  "Sea Point",
  "Claremont",
  "Constantia",
  "Durbanville",
  "Stellenbosch",
  "George",
  "Knysna",
];

export default function Vision() {
  return (
    <section className="section-pad section--sunken" id="vision">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">The vision</span>
          <span className="section-index">07 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="One kitchen. A Western Cape brand." />
          <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
            A central kitchen supplies every gelato &amp; coffee store — the
            expensive equipment is bought once. Each new counter adds revenue,
            not duplication.
          </p>
        </div>
        <div className="vision-grid">
          <div className="photo photo--wipe vision-photo reveal">
            <Parallax
              src={photo("storefront")}
              alt="Batch. gelato and coffee counter"
              speed={0.1}
            />
            <span className="caption-chip">Gelato &amp; coffee, paired</span>
          </div>
          <div
            className="reveal"
            id="marginBars"
            style={{ "--d": "120ms" } as CSSProperties}
          >
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 700,
                fontSize: "clamp(22px, 2.4vw, 28px)",
                margin: "0 0 6px",
              }}
            >
              Three streams, strong margins.
            </h3>
            <div className="margins">
              {streams.map((s) => (
                <div className="mrow" key={s.label}>
                  <b>
                    <span>{s.label}</span>
                    <span>{s.pct}</span>
                  </b>
                  <div className="bar">
                    <i
                      style={
                        { "--w": s.w, "--d": `${s.d}ms` } as CSSProperties
                      }
                    ></i>
                  </div>
                </div>
              ))}
            </div>
            <div className="blend">
              <span>Blended gross margin per customer</span>
              <b>~68%</b>
            </div>
          </div>
        </div>
        <div
          className="photo photo--wipe reveal"
          style={{
            aspectRatio: "16 / 7.5",
            marginTop: "clamp(36px, 4vw, 56px)",
          }}
        >
          <Parallax
            src={photo("shop-interior-counter")}
            alt="Inside a Batch. gelato counter"
            speed={0.08}
          />
          <span className="caption-chip">The counter, brought to life</span>
        </div>
        <div className="towns" style={{ marginTop: "clamp(36px, 4vw, 56px)" }}>
          {towns.map((t, i) => (
            <span
              className="town reveal"
              key={t}
              style={{ "--d": `${i * 60}ms` } as CSSProperties}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="towns-cap reveal">
          Potential sites — tourist and high foot-traffic areas. Company-owned
          first; franchise later.
        </p>
      </div>
    </section>
  );
}
