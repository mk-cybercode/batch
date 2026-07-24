import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";

const thesis = [
  {
    num: "01",
    title: "Near-zero fixed costs",
    body: "Home production. No rent, no staff, no salary drawn — the operator keeps a full-time job throughout. The business can trade slowly, or pause, at almost no carrying cost.",
  },
  {
    num: "02",
    title: "Made ahead, frozen",
    body: "Gelato is churned in batches and sold over the following weeks — about 9 hours of production a week in year one, rising to around 12 by the second summer. Not tied to daily demand, so it fits around a job and later makes each store simple to run.",
  },
  {
    num: "03",
    title: "A hard downside floor",
    body: "53% of the capital is one imported Italian machine with an established resale market. If demand never lands, the equipment is resold to recover most of the investment. Exposure is capped, not open-ended.",
  },
];

export default function WhyModel() {
  return (
    <section className="section-pad section--inverse" id="why">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">Why this model</span>
          <span className="section-index">02 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="Built to be hard to lose on." />
          <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
            Validate before scaling. Phase 1 proves the product and the demand
            at minimal fixed cost — a store carries rent, staff and a larger
            machine, and is justified only once the product has proven it
            sells.
          </p>
        </div>
        <div className="thesis">
          {thesis.map((t, i) => (
            <div
              className="thesis-item reveal"
              key={t.num}
              style={{ "--d": `${i * 120}ms` } as CSSProperties}
            >
              <span className="thesis-num">{t.num}</span>
              <h3>{t.title}</h3>
              <p>{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
