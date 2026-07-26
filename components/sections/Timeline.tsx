import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import { launchPlan } from "@/lib/site";

export default function Timeline() {
  return (
    <section className="section-pad" id="plan">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">Launch plan</span>
          <span className="section-index">06 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="The batch freezer is available now." />
          <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
            The plan builds through the second half of 2026 toward trading in
            the summer market season, without rushing — the intention is to
            grow organically rather than force everything into three months.
          </p>
        </div>
        <div className="seasons seasons--six">
          {launchPlan.map((t, i) => (
            <div
              className={`season${t.variant ? ` season--${t.variant}` : ""} reveal`}
              key={t.tag}
              style={{ "--d": `${i * 100}ms` } as CSSProperties}
            >
              <span className="s-tag">{t.tag}</span>
              <p>{t.body}</p>
            </div>
          ))}
        </div>
        <p className="plan-goal reveal">
          The business starts small and grows organically — it will build
          presence where it can, learn, and <em>scale into larger
          opportunities</em> as they open.
        </p>
      </div>
    </section>
  );
}
