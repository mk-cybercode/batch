import type { CSSProperties } from "react";
import { risks } from "@/lib/site";

export default function Risks() {
  return (
    <section className="section-pad" id="risk" style={{ paddingTop: 0 }}>
      <div className="container">
        <div
          className="kicker-row reveal"
          style={{ marginBottom: "clamp(28px, 4vw, 44px)" }}
        >
          <span className="overline">Risks and mitigation</span>
          <span className="section-index">
            Further risks will be added as market research is completed
          </span>
        </div>
        <div className="risks">
          {risks.map((r, i) => (
            <div
              className="risk reveal"
              key={r.title}
              style={{ "--d": `${(i % 4) * 90}ms` } as CSSProperties}
            >
              <b>{r.title}</b>
              <p>{r.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
