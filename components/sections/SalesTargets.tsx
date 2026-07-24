import type { CSSProperties } from "react";
import SplitHeading from "@/components/fx/SplitHeading";
import Parallax from "@/components/fx/Parallax";
import { photo, targetsYear1, targetsYear2, type TargetRow } from "@/lib/site";

function TargetTable({ rows, label }: { rows: TargetRow[]; label: string }) {
  return (
    <div className="tcard">
      <table className="ttable">
        <caption className="sr-only">{label}</caption>
        <thead>
          <tr>
            <th scope="col">Month</th>
            <th scope="col">Tubs</th>
            <th scope="col">Litres</th>
            <th scope="col">Revenue</th>
            <th scope="col">Repay</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month} className={r.hi ? "hi" : undefined}>
              <td>{r.month}</td>
              <td>{r.tubs}</td>
              <td>{r.litres}</td>
              <td>{r.revenue}</td>
              <td className="repay">{r.repay}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SalesTargets() {
  return (
    <section className="section-pad" id="targets">
      <div className="container">
        <div className="kicker-row reveal">
          <span className="overline">Monthly volume to hit repayment</span>
        </div>
        <div className="targets-head">
          <div className="section-head">
            <SplitHeading text="Seasonal by design." />
            <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
              Targets follow the Cape Town summer — a December trades at
              roughly 2.5× a July — and the repayment flexes with them, month
              by month.
            </p>
          </div>
          <div
            className="photo photo--wipe photo--tilt targets-photo reveal"
            style={{ "--d": "180ms" } as CSSProperties}
          >
            <Parallax
              src={photo("gelato-pop")}
              alt="A chocolate-dipped Batch. gelato pop"
              speed={0.06}
              loading="lazy"
            />
          </div>
        </div>
        <div className="targets-grid">
          <div className="reveal" style={{ "--d": "0ms" } as CSSProperties}>
            <TargetTable rows={targetsYear1} label="Sales targets, December 2026 to August 2027" />
          </div>
          <div className="reveal" style={{ "--d": "120ms" } as CSSProperties}>
            <TargetTable rows={targetsYear2} label="Sales targets, September 2027 to May 2028" />
          </div>
        </div>
        <div className="repay-note reveal" style={{ "--d": "200ms" } as CSSProperties}>
          <strong>Repayment structure:</strong> R12,000 minimum monthly, plus
          60% of profit above that threshold. Payments start December 2026,
          with full repayment by April 2028 — never demanding more than the
          business has earned.
        </div>
      </div>
    </section>
  );
}
