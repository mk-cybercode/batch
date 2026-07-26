import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";

const summary = [
  {
    num: "01",
    title: "A capital loan, not equity",
    body: "This is a capital loan of R320,000, not an investment for a share of the business. The capital funds the equipment, ingredients, certification and brand work required to begin production and reach first sales, and is repaid in full from trading profit.",
  },
  {
    num: "02",
    title: "The purpose of this phase",
    body: "There is demand for good gelato in Cape Town — the question is which channel to build around. The options are events, a store, supplying larger businesses such as hotel groups, supplying stockists, or a combination of these. This phase reveals the strongest path before larger capital is committed.",
  },
  {
    num: "03",
    title: "No salary is drawn",
    body: "The operator retains full-time employment throughout Phase 1 and draws no salary from the business. This keeps fixed costs low and means the business can trade slowly, or pause, at minimal cost — the central reason the risk is contained.",
  },
];

export default function WhyModel() {
  return (
    <section className="section-pad section--inverse" id="why">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">Executive summary</span>
          <span className="section-index">02 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="A limited cost and a limited risk." />
          <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
            A store carries rent, staff and a substantially larger machine. It
            is justified once the business has established its path and its
            brand — not simply once a product has sold. This phase provides
            that foundation.
          </p>
        </div>
        <div className="thesis">
          {summary.map((t, i) => (
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
