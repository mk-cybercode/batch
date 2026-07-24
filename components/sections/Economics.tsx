import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";

type Tub = {
  name: string;
  price: string;
  costPct: number;
  cost: string;
  profit: string;
  margin: string;
  d: [number, number];
};

const tubs: Tub[] = [
  {
    name: "500ml tub — the core product",
    price: "R190",
    costPct: 33.0,
    cost: "R62.76",
    profit: "R127.24",
    margin: "67% margin",
    d: [100, 400],
  },
  {
    name: "3-pack · 3 × 175ml",
    price: "R195",
    costPct: 36.3,
    cost: "R70.76",
    profit: "R124.24",
    margin: "64% margin",
    d: [200, 500],
  },
  {
    name: "175ml cup · markets",
    price: "R65",
    costPct: 33.8,
    cost: "R21.97",
    profit: "R43.03",
    margin: "66% margin",
    d: [300, 600],
  },
];

export default function Economics() {
  return (
    <section
      className="section-pad section--sunken"
      id="economics"
      style={{ paddingTop: "clamp(88px, 10vw, 130px)" }}
    >
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">Unit economics</span>
          <span className="section-index">04 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="Every tub carries its weight." />
        </div>
        <div className="econ-grid">
          <div className="econ-left reveal">
            <div className="big-num">
              <span data-count data-value="67" data-suffix="%">
                67%
              </span>
            </div>
            <p className="tag">
              Gross margin on the 500ml tub — <strong>64%</strong> on the
              3-pack, <strong>66%</strong> on the cup. Costs include
              ingredients, packaging and an 8% wastage allowance.
            </p>
          </div>
          <div
            className="tubs reveal"
            id="tubs"
            style={{ "--d": "120ms" } as CSSProperties}
          >
            {tubs.map((t) => (
              <div className="tub" key={t.name}>
                <div className="tub-head">
                  <strong>{t.name}</strong>
                  <span>{t.price}</span>
                </div>
                <div className="tub-bar">
                  <span
                    className="cost"
                    style={
                      {
                        left: 0,
                        width: `${t.costPct}%`,
                        "--d": `${t.d[0]}ms`,
                      } as CSSProperties
                    }
                  ></span>
                  <span
                    className="profit"
                    style={
                      {
                        left: `${t.costPct}%`,
                        width: `${100 - t.costPct}%`,
                        "--d": `${t.d[1]}ms`,
                      } as CSSProperties
                    }
                  ></span>
                </div>
                <div className="tub-key">
                  <span className="k-cost">
                    <i></i>Cost {t.cost}
                  </span>
                  <span className="k-profit">
                    <i></i>Profit {t.profit}
                  </span>
                  <span>
                    <strong>{t.margin}</strong>
                  </span>
                </div>
              </div>
            ))}
            <p className="econ-insight">
              <strong>Priced under the leaders:</strong> Moro Gelato retails a
              500ml tub at R209 in-store. Batch. enters at R190 direct — a
              clear reason to try the product, at a healthy margin: R127
              profit on every tub.
            </p>
            <p className="econ-note">
              On Uber Eats, listed prices absorb the platform commission, so
              the amount received remains R190. Stockists buy at ≈ R125
              wholesale. With no rent, staff or salary drawn, gross sits close
              to net.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
