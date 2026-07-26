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
            <th scope="col">Tubs (500ml eq.)</th>
            <th scope="col">Revenue</th>
            <th scope="col">Repayment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.month} className={r.hi ? "hi" : undefined}>
              <td>{r.month}</td>
              <td>{r.tubs}</td>
              <td>{r.revenue}</td>
              <td className={r.retained ? "retained" : "repay"}>{r.repay}</td>
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
          <span className="overline">Monthly sales targets</span>
        </div>
        <div className="targets-head">
          <div className="section-head">
            <SplitHeading text="Repayment flexes with the season." />
            <p className="lede reveal" style={{ "--d": "120ms" } as CSSProperties}>
              The figures show the most conservative expected volume, revenue
              and repayment in each month. The first months — November 2026 to
              March 2027 — are retained in the business; repayment begins in
              April 2027.
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
            <TargetTable
              rows={targetsYear1}
              label="Monthly sales targets, November 2026 to September 2027"
            />
          </div>
          <div className="reveal" style={{ "--d": "120ms" } as CSSProperties}>
            <TargetTable
              rows={targetsYear2}
              label="Monthly sales targets, October 2027 to August 2028"
            />
          </div>
        </div>
        <p className="targets-cap reveal">
          † The final month settles the small remaining balance to clear the
          loan in full by August 2028.
        </p>
        <div className="repay-note reveal" style={{ "--d": "200ms" } as CSSProperties}>
          <strong>The repayment structure:</strong> a minimum of R12,000 per
          month, plus 60% of any net profit above that minimum. Repayment
          begins in April 2027 and, on the projected figures, clears the full
          R320,000 by August 2028 — repayment never exceeds what the business
          has earned.
        </div>
      </div>
    </section>
  );
}
