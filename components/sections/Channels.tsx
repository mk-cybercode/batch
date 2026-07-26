import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import Parallax from "@/components/fx/Parallax";
import { channels, photo, profitPerLitre } from "@/lib/site";

export default function Channels() {
  return (
    <section className="section-pad section--sunken" id="channels">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">Revenue streams</span>
          <span className="section-index">05 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="Four channels, four buyers." />
          <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
            Because production capacity is limited in Phase 1, the value of
            each channel is measured as profit per litre of gelato produced. On
            that basis, events are the most valuable use of capacity and
            stockists the least, though each plays a role.
          </p>
        </div>

        <div className="ppl reveal" id="ppl">
          <span className="ppl-title">Profit per litre of gelato produced</span>
          {profitPerLitre.map((r, i) => (
            <div className="ppl-row" key={r.label}>
              <span className="ppl-label">{r.label}</span>
              <div className="ppl-track">
                <i
                  className={`ppl-fill ppl-fill--${r.tone}`}
                  style={{ "--w": r.w, "--d": `${i * 110}ms` } as CSSProperties}
                ></i>
              </div>
              <span className="ppl-value">{r.value}</span>
            </div>
          ))}
          <p className="ppl-note">
            Margins by channel: direct and Uber Eats 65% · market cup 66% ·
            3-pack 64% · stockist wholesale 46%. An event returns a minimum of
            ~R5,000 in profit.
          </p>
        </div>

        <div className="chan-grid">
          {channels.map((c, i) => (
            <div
              className={`chan chan--${c.tone} reveal`}
              key={c.title}
              style={{ "--d": `${i * 90}ms` } as CSSProperties}
            >
              <span className="chan-role">{c.role}</span>
              <h4>{c.title}</h4>
              <p>{c.body}</p>
            </div>
          ))}
        </div>

        <div className="photo photo--wipe band-photo reveal">
          <Parallax
            src={photo("packaging-range")}
            alt="Batch. tub packaging across the flavour range"
            speed={0.08}
            loading="lazy"
          />
        </div>

        <p className="chan-note reveal">
          Events and direct sales are prioritised, stockists are used for
          visibility and baseline volume, and markets are treated primarily as{" "}
          <em>brand-building</em>.
        </p>
      </div>
    </section>
  );
}
