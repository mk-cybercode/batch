import type { CSSProperties } from "react";
import Parallax from "@/components/fx/Parallax";
import { askNow, askLater, photo } from "@/lib/site";

function Items({ items }: { items: { label: string; amount: string; w: number }[] }) {
  return (
    <div className="items">
      {items.map((it, i) => (
        <div className="item" key={it.label}>
          <b>
            <span>{it.label}</span>
            <span>{it.amount}</span>
          </b>
          <div className="bar">
            <i
              style={{ "--w": it.w, "--d": `${i * 90}ms` } as CSSProperties}
            ></i>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Ask() {
  return (
    <section className="section-pad" id="ask">
      <div className="container">
        <div className="ask-head">
          <span className="overline reveal">The ask · Phase 1</span>
          <div className="big-num reveal" style={{ "--d": "100ms" } as CSSProperties}>
            R
            <span data-count data-value="320" data-group>
              320
            </span>
            <small>k</small>
          </div>
          <p className="ask-sub reveal" style={{ "--d": "200ms" } as CSSProperties}>
            Everything required to begin. Repaid from trading profit — in full
            by April 2028.
          </p>
        </div>
        <div className="stages" id="stages">
          <div className="stage reveal">
            <div className="stage-head">
              <h3>
                What the capital buys
                <small>Begin production</small>
              </h3>
              <b>R320,000</b>
            </div>
            <Items items={askNow} />
            <p className="stage-note">
              53% of the total is the gelato machine — the single asset that
              makes production possible.
            </p>
          </div>
          <div
            className="stage stage--later reveal"
            style={{ "--d": "150ms" } as CSSProperties}
          >
            <div className="stage-head">
              <h3>
                A possible second phase
                <small>Only if growth outpaces projection</small>
              </h3>
              <b>R195,000</b>
            </div>
            <Items items={askLater} />
            <p className="stage-note">
              Not part of the current request. Pursued only on evidence —
              consistent sales, event bookings turned away for capacity,
              stockists requesting more than can be supplied.
            </p>
            <div className="photo photo--wipe photo--tilt stage-photo">
              <Parallax
                src={photo("phase2-cart")}
                alt="The purpose-built Batch. market cart"
                speed={0.06}
                loading="lazy"
              />
              <span className="caption-chip">The Phase 2 market cart</span>
            </div>
          </div>
        </div>
        <p className="floor reveal">
          Equipment retains resale value — <em>a floor under the investment.</em>
        </p>
      </div>
    </section>
  );
}
