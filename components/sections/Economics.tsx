import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import { products } from "@/lib/site";

export default function Economics() {
  return (
    <section
      className="section-pad section--sunken"
      id="economics"
      style={{ paddingTop: "clamp(88px, 10vw, 130px)" }}
    >
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">Products and pricing</span>
          <span className="section-index">04 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="Costs include ingredients, packaging and an 8% allowance for waste." />
        </div>
        <div className="econ-grid">
          <div className="econ-left reveal">
            <div className="big-num">
              <span data-count data-value="65" data-suffix="%">
                65%
              </span>
            </div>
            <p className="tag">
              Margin on the 500ml tub, priced at R190 through direct channels
              — <strong>64%</strong> on the 3-pack and <strong>66%</strong> on
              the 175ml cup.
            </p>
          </div>
          <div
            className="tubs reveal"
            id="tubs"
            style={{ "--d": "120ms" } as CSSProperties}
          >
            {products.map((t) => (
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
                    <i></i>Cost to produce {t.cost}
                  </span>
                  <span className="k-profit">
                    <i></i>Gross profit {t.profit}
                  </span>
                  <span>
                    <strong>{t.margin} margin</strong>
                  </span>
                </div>
              </div>
            ))}
            <p className="econ-insight">
              <strong>Channel pricing:</strong> on Uber Eats the tub is listed
              higher to absorb the platform&rsquo;s commission, so the amount
              received remains R190. Stockists buy at a wholesale price of
              around R125 — a 46% margin to BATCH. — which leaves them room to
              retail at a healthy margin of their own.
            </p>
            <p className="econ-note">
              Ingredient cost comes from the supplier&rsquo;s costing
              calculator, which prices gelato per 70g portion including a 35%
              allowance for consumables such as electricity and water. This is
              scaled to each tub&rsquo;s actual weight — a 500ml tub holds
              roughly 380g of gelato.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
