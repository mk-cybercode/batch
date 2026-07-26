import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import Parallax from "@/components/fx/Parallax";
import { photo, storeAreas, storeProducts } from "@/lib/site";

export default function Vision() {
  return (
    <section className="section-pad section--sunken" id="vision">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">The longer-term vision</span>
          <span className="section-index">07 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="A store." />
          <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
            The end goal is a gelato and coffee store in a high foot-traffic
            area. In time, one central production kitchen could supply a group
            of stores.
          </p>
        </div>
        <div className="vision-grid">
          <div className="photo photo--wipe vision-photo reveal">
            <Parallax
              src={photo("storefront")}
              alt="A Batch. gelato and coffee counter"
              speed={0.1}
            />
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
              A store trades on three products rather than one.
            </h3>
            <div className="margins">
              {storeProducts.map((s, i) => (
                <div className="mrow" key={s.name}>
                  <b>
                    <span>
                      {s.name} — {s.body}
                    </span>
                    <span>{s.pct}</span>
                  </b>
                  <div className="bar">
                    <i
                      style={
                        { "--w": s.w, "--d": `${i * 130}ms` } as CSSProperties
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
            <p className="econ-note" style={{ marginTop: 18 }}>
              Coffee is the key to the store model. It sells during portions of
              the day when gelato sales decrease and brings people in daily
              rather than occasionally, smoothing the seasonality that
              constrains a gelato-only business.
            </p>
          </div>
        </div>
        <div className="towns" style={{ marginTop: "clamp(36px, 4vw, 56px)" }}>
          {storeAreas.map((t, i) => (
            <span
              className="town reveal"
              key={t}
              style={{ "--d": `${i * 50}ms` } as CSSProperties}
            >
              {t}
            </span>
          ))}
        </div>
        <p className="towns-cap reveal">
          A store carries high fixed costs — rent, staff, utilities — and
          requires a substantially larger batch freezer than the machine funded
          in Phase 1. It is a separately funded stage, not part of this
          request.
        </p>
      </div>
    </section>
  );
}
