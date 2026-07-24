import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import { timeline } from "@/lib/site";

export default function Timeline() {
  return (
    <section className="section-pad" id="plan">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">
            The plan — the machine is available now
          </span>
          <span className="section-index">06 / 07</span>
        </div>
        <div className="section-head">
          <SplitHeading text="Launching ahead of December." />
        </div>
        <div className="seasons seasons--six">
          {timeline.map((t, i) => (
            <div
              className={`season${t.variant ? ` season--${t.variant}` : ""} reveal`}
              key={t.tag}
              style={{ "--d": `${i * 100}ms` } as CSSProperties}
            >
              <span className="s-tag">{t.tag}</span>
              <h4>{t.title}</h4>
              <p>{t.body}</p>
            </div>
          ))}
        </div>
        <p className="plan-goal reveal">
          December is deliberate — the start of the Cape Town summer season.{" "}
          <em>The goal isn&rsquo;t profit yet. It&rsquo;s proof</em> — demand,
          channels, and an audience for the store.
        </p>
      </div>
    </section>
  );
}
