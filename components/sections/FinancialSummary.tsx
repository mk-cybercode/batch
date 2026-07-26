import type { CSSProperties } from "react";

const cells = [
  { b: "R1,038,600", em: "turnover" },
  { b: "R608,520", em: "gross profit · 59% blended" },
  { b: "R167,200", em: "operating costs" },
  { b: "2,070 L", em: "gelato sold · 4,140 tubs" },
];

export default function FinancialSummary() {
  return (
    <section className="section-pad section--inverse" id="financials">
      <div className="container">
        <div className="be-center">
          <span className="overline reveal">
            Financial projections · Nov 2026 – Aug 2028 · 22 months
          </span>
          <div className="big-num reveal" style={{ "--d": "100ms" } as CSSProperties}>
            <span
              data-count
              data-value="441320"
              data-prefix="R"
              data-group
              data-locale="en-US"
            >
              R441,320
            </span>
            <small>net profit</small>
          </div>
          <p className="be-sub reveal" style={{ "--d": "220ms" } as CSSProperties}>
            Sales are expected to be modest and sporadic at first, while
            packaging, flavours and operations are settled.
            <br />
            <em>R320,000 repaid in full by August 2028</em> — R121,320 retained
            in the business.
          </p>
        </div>
        <div className="be-row">
          {cells.map((c, i) => (
            <div
              className="be-cell reveal"
              key={c.em}
              style={{ "--d": `${i * 90}ms` } as CSSProperties}
            >
              <b>{c.b}</b>
              <em>{c.em}</em>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
