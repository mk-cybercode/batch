"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Bars, Card, Chip, Empty, SectionTitle, Spark, Stat } from "../ui";
import type { ModuleProps } from "../Shell";
import {
  batchesAvailable,
  bestSellers,
  capitalRemaining,
  financials,
  lowStock,
  monthlySeries,
  salesByChannel,
} from "@/lib/os/calc";
import { CHANNEL_LABEL } from "@/lib/os/types";
import { ZAR, dateLabel, monthKey, monthLabel, pct, today } from "@/lib/os/format";

export default function Dashboard({ onNavigate }: ModuleProps) {
  const { vault } = useVault();
  if (!vault) return null;

  const thisMonth = monthKey(today());
  const all = financials(vault);
  const month = financials(vault, thisMonth);
  const series = monthlySeries(vault, 6);
  const channels = salesByChannel(vault, thisMonth);
  const low = lowStock(vault);
  const sellers = bestSellers(vault, 5);
  const remaining = capitalRemaining(vault);

  const upcoming = [...vault.plan]
    .filter((p) => !p.done && p.date >= today())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const overdue = vault.plan.filter((p) => !p.done && p.date < today()).length;

  const recentSales = [...vault.sales]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  const readyRecipes = vault.recipes
    .filter((r) => r.stage === "approved")
    .map((r) => ({ r, batches: batchesAvailable(vault, r) }));

  const followUps = vault.customers.filter(
    (c) => c.followUpOn && c.followUpOn <= today()
  );

  return (
    <div className="os-stack">
      <div className="os-grid os-grid--4">
        <Stat
          label="Cash available"
          value={ZAR(all.cashAvailable)}
          sub={`${ZAR(remaining)} of capital unspent`}
          tone={all.cashAvailable >= 0 ? "pos" : "neg"}
          delay={0}
        />
        <Stat
          label="Revenue this month"
          value={ZAR(month.revenue)}
          sub={`${ZAR(all.revenue)} all time`}
          delay={60}
        />
        <Stat
          label="Gross profit"
          value={ZAR(month.grossProfit)}
          sub={month.revenue ? `${pct(month.grossMargin)} margin` : "No sales yet"}
          delay={120}
        />
        <Stat
          label="Net profit"
          value={ZAR(month.netProfit)}
          sub="After operating costs"
          tone={month.netProfit >= 0 ? "pos" : "neg"}
          delay={180}
        />
      </div>

      <div className="os-grid os-grid--4">
        <Stat label="Stock value" value={ZAR(all.inventoryValue)} sub={`${vault.inventory.filter((i) => !i.archived).length} items`} delay={220} />
        <Stat label="Equipment & assets" value={ZAR(all.assetValue)} sub={`${vault.equipment.length} on register`} delay={260} />
        <Stat label="Loan outstanding" value={ZAR(all.loanOutstanding)} sub={`of ${ZAR(vault.settings.loanCapital)}`} delay={300} />
        <Stat label="Open tasks" value={String(vault.plan.filter((p) => !p.done).length)} sub={overdue ? `${overdue} overdue` : "Nothing overdue"} tone={overdue ? "neg" : undefined} delay={340} />
      </div>

      {(low.length > 0 || followUps.length > 0) && (
        <>
          <SectionTitle>Needs attention</SectionTitle>
          <div className="os-list">
            {low.map((i) => (
              <div className="os-list-row" key={i.id}>
                <AlertTriangle size={16} style={{ color: "var(--os-danger)" }} />
                <strong>{i.name}</strong>
                <span className="os-muted os-small">
                  {i.stock} {i.unit} left · reorder at {i.reorderLevel}
                </span>
                <button
                  className="os-btn os-btn--ghost os-btn--sm os-push"
                  onClick={() => onNavigate("inventory")}
                >
                  Restock <ArrowRight size={13} />
                </button>
              </div>
            ))}
            {followUps.map((c) => (
              <div className="os-list-row" key={c.id}>
                <Chip tone="caramel">Follow up</Chip>
                <strong>{c.name}</strong>
                <span className="os-muted os-small">due {dateLabel(c.followUpOn!)}</span>
                <button
                  className="os-btn os-btn--ghost os-btn--sm os-push"
                  onClick={() => onNavigate("sales")}
                >
                  Open <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="os-grid os-grid--2">
        <Card pad>
          <div className="os-flex" style={{ marginBottom: 10 }}>
            <strong>Revenue · last 6 months</strong>
            <span className="os-chip os-right">{ZAR(all.revenue)} total</span>
          </div>
          <Spark
            points={series.map((s) => s.revenue)}
            labels={series.map((s) => `${monthLabel(s.key)} ${ZAR(s.revenue)}`)}
          />
          <div className="os-flex os-small os-muted" style={{ marginTop: 8 }}>
            <span>{monthLabel(series[0].key)}</span>
            <span className="os-right">{monthLabel(series.at(-1)!.key)}</span>
          </div>
        </Card>

        <Card pad>
          <strong>Sales by channel · this month</strong>
          <div style={{ marginTop: 12 }}>
            {channels.length ? (
              <Bars
                rows={channels.map(([c, t]) => ({
                  label: CHANNEL_LABEL[c],
                  value: t.revenue,
                }))}
              />
            ) : (
              <p className="os-muted os-small">No sales recorded this month yet.</p>
            )}
          </div>
        </Card>
      </div>

      <div className="os-grid os-grid--2">
        <Card pad>
          <div className="os-flex" style={{ marginBottom: 12 }}>
            <strong>Coming up</strong>
            <button
              className="os-btn os-btn--ghost os-btn--sm os-right"
              onClick={() => onNavigate("planner")}
            >
              Planner
            </button>
          </div>
          {upcoming.length ? (
            <div className="os-list">
              {upcoming.map((p) => (
                <div className="os-list-row" key={p.id}>
                  <Chip>{dateLabel(p.date).replace(/ \d{4}$/, "")}</Chip>
                  <span>{p.title}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="os-muted os-small">Nothing scheduled.</p>
          )}
        </Card>

        <Card pad>
          <div className="os-flex" style={{ marginBottom: 12 }}>
            <strong>Ready to produce</strong>
            <button
              className="os-btn os-btn--ghost os-btn--sm os-right"
              onClick={() => onNavigate("production")}
            >
              Production
            </button>
          </div>
          {readyRecipes.length ? (
            <div className="os-list">
              {readyRecipes.map(({ r, batches }) => (
                <div className="os-list-row" key={r.id}>
                  <strong>{r.name}</strong>
                  <span className="os-muted os-small">v{r.version}</span>
                  <span className="os-push">
                    <Chip tone={batches > 0 ? "accent" : "danger"}>
                      {batches} batch{batches === 1 ? "" : "es"} of stock
                    </Chip>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="No approved recipes yet"
              body="Approve a recipe in R&D and it becomes available to produce."
            />
          )}
        </Card>
      </div>

      <div className="os-grid os-grid--2">
        <Card pad>
          <strong>Recent sales</strong>
          <div style={{ marginTop: 12 }}>
            {recentSales.length ? (
              <div className="os-list">
                {recentSales.map((s) => {
                  const rev = s.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
                  return (
                    <div className="os-list-row" key={s.id}>
                      <Chip>{CHANNEL_LABEL[s.channel]}</Chip>
                      <span className="os-small os-muted">{dateLabel(s.date)}</span>
                      <strong className="os-push">{ZAR(rev)}</strong>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="os-muted os-small">No sales captured yet.</p>
            )}
          </div>
        </Card>

        <Card pad>
          <strong>Best sellers</strong>
          <div style={{ marginTop: 12 }}>
            {sellers.length ? (
              <Bars rows={sellers.map((s) => ({ label: s.name, value: s.revenue }))} />
            ) : (
              <p className="os-muted os-small">
                Once you record sales, your strongest products appear here.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
