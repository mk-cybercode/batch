import type { CSSProperties } from "react";

const cells = [
  { b: "R955,700", em: "turnover" },
  { b: "R640,017", em: "gross profit · 67%" },
  { b: "R210,000", em: "operating costs" },
  { b: "2,515 L", em: "gelato sold · 5,030 tubs" },
];

export default function FinancialSummary() {
  return (
    <section className="section-pad section--inverse" id="financials">
      <div className="container">
        <div className="be-center">
          <span className="overline reveal">
            First 18 months · Dec 2026 – May 2028 · two summers
          </span>
          <div className="big-num reveal" style={{ "--d": "100ms" } as CSSProperties}>
            <span
              data-count
              data-value="430017"
              data-prefix="R"
              data-group
              data-locale="en-US"
            >
              R430,017
            </span>
            <small>net profit</small>
          </div>
          <p className="be-sub reveal" style={{ "--d": "220ms" } as CSSProperties}>
            Two summers of trading — about 140 litres · 279 tubs a month.
            <br />
            <em>R320,000 repaid in full by April 2028</em> — R110,017 retained
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
