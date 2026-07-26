import type { CSSProperties } from "react";
import Parallax from "@/components/fx/Parallax";
import { capital, photo, secondPhase } from "@/lib/site";

type Item = { label: string; amount: string; w: number; note?: string };

function Items({ items }: { items: Item[] }) {
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
              style={{ "--w": it.w, "--d": `${i * 70}ms` } as CSSProperties}
            ></i>
          </div>
          {it.note && <small className="item-note">{it.note}</small>}
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
          <span className="overline reveal">The capital · Phase 1</span>
          <div className="big-num reveal" style={{ "--d": "100ms" } as CSSProperties}>
            R
            <span data-count data-value="320" data-group>
              320
            </span>
            <small>k</small>
          </div>
          <p className="ask-sub reveal" style={{ "--d": "200ms" } as CSSProperties}>
            This funds everything needed to begin production and reach first
            sales.
          </p>
        </div>
        <div className="stages" id="stages">
          <div className="stage reveal">
            <div className="stage-head">
              <h3>
                Total capital required
                <small>Phase 1</small>
              </h3>
              <b>R320,000</b>
            </div>
            <Items items={capital} />
            <p className="stage-note">
              The single largest item is the batch freezer, which accounts for
              53% of the total. The majority of the capital is spent on
              equipment with a resale market — principally the Italian batch
              freezer, an industrial machine that holds its value. Should the
              business not proceed, it can be sold to recover part of the loan.
            </p>
          </div>
          <div
            className="stage stage--later reveal"
            style={{ "--d": "150ms" } as CSSProperties}
          >
            <div className="stage-head">
              <h3>
                A possible second phase
                <small>If pursued</small>
              </h3>
              <b>R200,000</b>
            </div>
            <Items items={secondPhase} />
            <p className="stage-note">
              A second phase is not part of the current request. It would be
              pursued only if trading in Phase 1 demonstrates that expansion is
              necessary — consistent sales, event bookings that must be turned
              away for lack of a proper cart, and stockists requesting more
              than can be supplied.
            </p>
            <div className="photo photo--wipe photo--tilt stage-photo">
              <Parallax
                src={photo("market-cart")}
                alt="A custom-build market cart with an integrated freezer"
                speed={0.06}
                loading="lazy"
              />
            </div>
          </div>
        </div>
        <p className="floor reveal">
          Only the batch freezer is a firm supplier quote. Other items are{" "}
          <em>working estimates, to be confirmed with formal quotes</em> before
          funds are drawn.
        </p>
      </div>
    </section>
  );
}
