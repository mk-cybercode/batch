"use client";

import { useState } from "react";
import { Check, Download, Pencil, Plus, Trash2, Wallet, Wrench } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Bars, Card, Chip, Empty, Field, Modal, SectionTitle, Spark } from "../ui";
import { postEquipmentPurchase } from "@/lib/os/actions";
import {
  capitalRemaining,
  expensesByCategory,
  financials,
  fundingLabel,
  fundingOf,
  monthlySeries,
  ownerCapital,
} from "@/lib/os/calc";
import { ZAR, dateLabel, download, monthLabel, pct, toCSV, today, uid } from "@/lib/os/format";
import {
  EXPENSE_LABEL,
  type CapitalEvent,
  type ExpenseCategory,
  type Funding,
} from "@/lib/os/types";

export default function Finance() {
  const { vault, update } = useVault();
  const [tab, setTab] = useState<"overview" | "expenses" | "capital" | "equipment">(
    "overview"
  );
  const [addingExpense, setAddingExpense] = useState(false);
  /* Equipment whose funding is being set or revisited. */
  const [funding, setFunding] = useState<string | null>(null);
  const [capitalEvent, setCapitalEvent] = useState<CapitalEvent | "new" | null>(null);
  /* A purchase-plan line being ticked off. */
  const [planItem, setPlanItem] = useState<string | null>(null);
  if (!vault) return null;
  /* Narrowing doesn't reach into the callbacks below, so bind it once. */
  const v = vault;

  const f = financials(vault);
  const series = monthlySeries(vault, 6);
  const byCat = expensesByCategory(vault);
  const remaining = capitalRemaining(vault);

  function exportLedger() {
    download(
      `batch-expenses-${today()}.csv`,
      toCSV([
        [
          "Date",
          "Category",
          "Description",
          "Amount",
          "From capital",
          "From own money",
          "From trading",
          "Supplier",
        ],
        ...[...v.expenses]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((e) => {
            const f = fundingOf(e);
            return [
              e.date,
              EXPENSE_LABEL[e.category],
              e.description,
              e.amount.toFixed(2),
              f.capital.toFixed(2),
              f.owner.toFixed(2),
              f.trading.toFixed(2),
              v.suppliers.find((s) => s.id === e.supplierId)?.name ?? "",
            ];
          }),
      ])
    );
  }

  return (
    <div className="os-stack">
      <div className="os-flex">
        <div className="os-stages">
          {(["overview", "expenses", "capital", "equipment"] as const).map((t) => (
            <button
              key={t}
              className="os-stage-pip"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t === "overview"
                ? "Overview"
                : t === "expenses"
                  ? "Expenses"
                  : t === "capital"
                    ? "Capital & loan"
                    : "Equipment"}
            </button>
          ))}
        </div>
        <div className="os-flex os-right">
          <button className="os-btn os-btn--ghost os-btn--sm" onClick={exportLedger}>
            <Download size={14} /> CSV
          </button>
          <button className="os-btn" onClick={() => setAddingExpense(true)}>
            <Plus size={15} /> Add expense
          </button>
        </div>
      </div>

      {tab === "overview" && (
        <>
          <div className="os-grid os-grid--4">
            <Card>
              <div className="os-stat-label">Cash available</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>{ZAR(f.cashAvailable)}</div>
              <div className="os-stat-sub">capital + sales − spend</div>
            </Card>
            <Card>
              <div className="os-stat-label">Revenue</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>{ZAR(f.revenue)}</div>
              <div className="os-stat-sub">{pct(f.grossMargin)} gross margin</div>
            </Card>
            <Card>
              <div className="os-stat-label">Net profit</div>
              <div
                className="os-stat-value"
                style={{
                  fontSize: 23,
                  color: f.netProfit >= 0 ? "var(--os-accent)" : "var(--os-danger)",
                }}
              >
                {ZAR(f.netProfit)}
              </div>
              <div className="os-stat-sub">after operating costs</div>
            </Card>
            <Card>
              <div className="os-stat-label">Loan outstanding</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>{ZAR(f.loanOutstanding)}</div>
              <div className="os-stat-sub">of {ZAR(vault.settings.loanCapital)}</div>
            </Card>
          </div>

          <div className="os-grid os-grid--2">
            <Card pad>
              <strong>Revenue &amp; profit · 6 months</strong>
              <div style={{ marginTop: 14 }}>
                <Spark points={series.map((s) => s.revenue)} />
              </div>
              <div className="os-flex os-small os-muted" style={{ marginTop: 8 }}>
                <span>{monthLabel(series[0].key)}</span>
                <span className="os-right">{monthLabel(series.at(-1)!.key)}</span>
              </div>
            </Card>
            <Card pad>
              <strong>Where the money goes</strong>
              <div style={{ marginTop: 12 }}>
                {byCat.length ? (
                  <Bars
                    rows={byCat.map(([c, v]) => ({ label: EXPENSE_LABEL[c], value: v }))}
                  />
                ) : (
                  <p className="os-muted os-small">No spend recorded yet.</p>
                )}
              </div>
            </Card>
          </div>

          <SectionTitle>Balance</SectionTitle>
          <div className="os-grid os-grid--4">
            <Card>
              <div className="os-stat-label">Stock value</div>
              <div className="os-stat-value" style={{ fontSize: 21 }}>{ZAR(f.inventoryValue)}</div>
            </Card>
            <Card>
              <div className="os-stat-label">Equipment</div>
              <div className="os-stat-value" style={{ fontSize: 21 }}>{ZAR(f.assetValue)}</div>
            </Card>
            <Card>
              <div className="os-stat-label">Total assets</div>
              <div className="os-stat-value" style={{ fontSize: 21 }}>{ZAR(f.totalAssets)}</div>
            </Card>
            <Card>
              <div className="os-stat-label">Liability (loan)</div>
              <div className="os-stat-value" style={{ fontSize: 21 }}>{ZAR(f.loanOutstanding)}</div>
            </Card>
          </div>
        </>
      )}

      {tab === "expenses" && (
        <>
          {vault.expenses.length ? (
            <div className="os-table-wrap">
              <table className="os-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Funded</th>
                    <th className="os-num">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...vault.expenses]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((e) => (
                      <tr key={e.id}>
                        <td>{dateLabel(e.date)}</td>
                        <td>{EXPENSE_LABEL[e.category]}</td>
                        <td>
                          {e.description}
                          {e.purchaseId && (
                            <span className="os-chip" style={{ marginLeft: 8 }}>
                              from purchase
                            </span>
                          )}
                        </td>
                        <td>
                          {(() => {
                            const f = fundingOf(e);
                            return (
                              <Chip tone={f.owner > 0 ? "accent" : f.capital > 0 ? "caramel" : undefined}>
                                {fundingLabel(f)}
                              </Chip>
                            );
                          })()}
                        </td>
                        <td className="os-num">{ZAR(e.amount)}</td>
                        <td>
                          {!e.purchaseId && (
                            <button
                              className="os-btn os-btn--ghost os-btn--sm"
                              onClick={() =>
                                update((d) => void (d.expenses = d.expenses.filter((x) => x.id !== e.id)))
                              }
                              aria-label="Delete expense"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No expenses yet"
              body="Purchases recorded in Inventory land here automatically. Add anything else — stall fees, fuel, electricity — by hand."
            />
          )}
        </>
      )}

      {tab === "capital" && (
        <>
          <div className="os-grid os-grid--4">
            <Card>
              <div className="os-stat-label">Capital drawn</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>
                {ZAR(vault.settings.loanCapital - remaining)}
              </div>
            </Card>
            <Card>
              <div className="os-stat-label">Capital remaining</div>
              <div
                className="os-stat-value"
                style={{
                  fontSize: 23,
                  color: remaining < 0 ? "var(--os-danger)" : "var(--os-accent)",
                }}
              >
                {ZAR(remaining)}
              </div>
              <div className="os-stat-sub">unspent of {ZAR(vault.settings.loanCapital)}</div>
            </Card>
            <Card>
              <div className="os-stat-label">My own money in</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>
                {ZAR(ownerCapital(vault))}
              </div>
              <div className="os-stat-sub">contributions and what you covered</div>
            </Card>
            <Card>
              <div className="os-stat-label">Repaid to date</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>
                {ZAR(
                  vault.capital.filter((c) => c.kind === "repayment").reduce((a, c) => a + c.amount, 0)
                )}
              </div>
            </Card>
          </div>

          <SectionTitle>Purchase plan · what the capital buys</SectionTitle>
          <div className="os-table-wrap">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th className="os-num">Budget</th>
                  <th>Status</th>
                  <th className="os-num">Capital left after</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let running = vault.settings.loanCapital;
                  return vault.capitalPlan.map((p) => {
                    running -= p.amount;
                    return (
                      <tr key={p.id}>
                        <td>{p.name}</td>
                        <td>{EXPENSE_LABEL[p.category]}</td>
                        <td className="os-num">{ZAR(p.amount)}</td>
                        <td>
                          {p.boughtOn ? (
                            <Chip tone="accent">Bought {dateLabel(p.boughtOn)}</Chip>
                          ) : (
                            <button
                              className="os-btn os-btn--ghost os-btn--sm"
                              onClick={() => setPlanItem(p.id)}
                            >
                              <Check size={13} /> Mark bought
                            </button>
                          )}
                        </td>
                        <td className="os-num">{ZAR(running)}</td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
          <p className="os-small os-muted">
            Marking an item bought posts it to the expense ledger and reduces the
            capital remaining. Actual purchases recorded in Inventory do the same.
          </p>

          <SectionTitle>My own money in the business</SectionTitle>
          {(() => {
            const covered = v.expenses
              .map((e) => ({ e, f: fundingOf(e) }))
              .filter((x) => x.f.owner > 0)
              .sort((a, b) => b.e.date.localeCompare(a.e.date));
            const contributions = v.capital
              .filter((c) => c.kind === "owner")
              .sort((a, b) => b.date.localeCompare(a.date));
            if (!covered.length && !contributions.length)
              return (
                <p className="os-small os-muted">
                  Nothing yet. Put money in with <strong>Money in or out</strong>{" "}
                  below, or record a purchase you paid for yourself — say the
                  blast freezer, where R15,000 came off the capital and you
                  covered the rest. Both land here.
                </p>
              );
            return (
              <div className="os-list">
                {contributions.map((c) => (
                  <div className="os-list-row" key={c.id}>
                    <Chip tone="accent">Put in</Chip>
                    <span className="os-small os-muted">{dateLabel(c.date)}</span>
                    <span>{c.note || "Own contribution"}</span>
                    <strong className="os-push">{ZAR(c.amount)}</strong>
                    <button
                      className="os-btn os-btn--ghost os-btn--sm"
                      onClick={() => setCapitalEvent(c)}
                      aria-label="Edit entry"
                    >
                      <Pencil size={13} />
                    </button>
                  </div>
                ))}
                {covered.map(({ e, f }) => (
                  <div className="os-list-row" key={e.id}>
                    <Chip tone="caramel">Paid for</Chip>
                    <span className="os-small os-muted">{dateLabel(e.date)}</span>
                    <span>
                      {e.description}
                      {f.capital > 0 && (
                        <span className="os-small os-muted">
                          {" "}
                          · {ZAR(f.capital)} of it from the capital
                        </span>
                      )}
                    </span>
                    <strong className="os-push">{ZAR(f.owner)}</strong>
                  </div>
                ))}
              </div>
            );
          })()}

          <SectionTitle>Loan, repayments and contributions</SectionTitle>
          <div className="os-list">
            {[...vault.capital]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((c) => (
                <div className="os-list-row" key={c.id}>
                  <Chip tone={c.kind === "repayment" ? "caramel" : "accent"}>
                    {c.kind === "loan"
                      ? "Loan in"
                      : c.kind === "owner"
                        ? "My money"
                        : "Repayment"}
                  </Chip>
                  <span className="os-small os-muted">{dateLabel(c.date)}</span>
                  <span>{c.note}</span>
                  <strong className="os-push">{ZAR(c.amount)}</strong>
                  <button
                    className="os-btn os-btn--ghost os-btn--sm"
                    onClick={() => setCapitalEvent(c)}
                    aria-label="Edit entry"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    className="os-btn os-btn--ghost os-btn--sm"
                    onClick={() =>
                      update((d) => void (d.capital = d.capital.filter((x) => x.id !== c.id)))
                    }
                    aria-label="Delete entry"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
          </div>
          <div className="os-flex">
            <button className="os-btn" onClick={() => setCapitalEvent("new")}>
              <Wallet size={14} /> Money in or out
            </button>
          </div>
        </>
      )}

      {tab === "equipment" && (
        <>
          {vault.equipment.length ? (
            <div className="os-grid os-grid--2">
              {vault.equipment.map((eq) => {
                const set = (fn: (x: typeof eq) => void) =>
                  update((d) => {
                    const t = d.equipment.find((x) => x.id === eq.id);
                    if (t) fn(t);
                  });
                return (
                  <Card key={eq.id}>
                    <div className="os-row">
                      <Field label="Name">
                        <input
                          className="os-input"
                          value={eq.name}
                          onChange={(e) => set((x) => void (x.name = e.target.value))}
                        />
                      </Field>
                      <Field label="Purchase price">
                        <input
                          className="os-input"
                          type="number"
                          value={eq.purchasePrice}
                          onChange={(e) =>
                            set((x) => void (x.purchasePrice = Number(e.target.value)))
                          }
                        />
                      </Field>
                    </div>
                    <div className="os-row">
                      <Field label="Purchased">
                        <input
                          className="os-input"
                          type="date"
                          value={eq.purchaseDate}
                          onChange={(e) => set((x) => void (x.purchaseDate = e.target.value))}
                        />
                      </Field>
                      <Field label="Serial">
                        <input
                          className="os-input"
                          value={eq.serial ?? ""}
                          onChange={(e) => set((x) => void (x.serial = e.target.value))}
                        />
                      </Field>
                      <Field label="Warranty until">
                        <input
                          className="os-input"
                          type="date"
                          value={eq.warrantyUntil ?? ""}
                          onChange={(e) => set((x) => void (x.warrantyUntil = e.target.value))}
                        />
                      </Field>
                    </div>
                    <div className="os-row">
                      <Field label="Condition">
                        <select
                          className="os-select"
                          value={eq.condition}
                          onChange={(e) =>
                            set((x) => void (x.condition = e.target.value as typeof eq.condition))
                          }
                        >
                          <option value="new">New</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="needs service">Needs service</option>
                        </select>
                      </Field>
                      <Field label="Service every (months)">
                        <input
                          className="os-input"
                          type="number"
                          value={eq.serviceIntervalMonths ?? 0}
                          onChange={(e) =>
                            set((x) => void (x.serviceIntervalMonths = Number(e.target.value)))
                          }
                        />
                      </Field>
                      <Field label="Last serviced">
                        <input
                          className="os-input"
                          type="date"
                          value={eq.lastServicedOn ?? ""}
                          onChange={(e) => set((x) => void (x.lastServicedOn = e.target.value))}
                        />
                      </Field>
                    </div>
                    <div className="os-flex">
                      {eq.expenseId ? (
                        <>
                          <Chip tone="accent">
                            {(() => {
                              const exp = v.expenses.find((x) => x.id === eq.expenseId);
                              return exp ? fundingLabel(fundingOf(exp)) : "Posted";
                            })()}
                          </Chip>
                          <button
                            className="os-btn os-btn--ghost os-btn--sm"
                            onClick={() => setFunding(eq.id)}
                          >
                            <Pencil size={13} /> Change funding
                          </button>
                        </>
                      ) : (
                        <button
                          className="os-btn os-btn--ghost os-btn--sm"
                          onClick={() => setFunding(eq.id)}
                        >
                          <Check size={13} /> Post to Finance
                        </button>
                      )}
                      <button
                        className="os-btn os-btn--ghost os-btn--sm os-right"
                        onClick={() =>
                          update((d) => void (d.equipment = d.equipment.filter((x) => x.id !== eq.id)))
                        }
                        aria-label="Delete equipment"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Empty
              title="Nothing on the register"
              body="Add the batch freezer, storage freezer and blender as you buy them — each one posts to Finance and Assets."
            />
          )}
          <button
            className="os-btn os-btn--ghost os-btn--sm"
            onClick={() =>
              update((d) =>
                d.equipment.push({
                  id: uid("eq_"),
                  name: "New equipment",
                  purchaseDate: today(),
                  purchasePrice: 0,
                  condition: "new",
                  serviceLog: [],
                })
              )
            }
          >
            <Wrench size={14} /> Add equipment
          </button>
        </>
      )}

      {addingExpense && <ExpenseForm onClose={() => setAddingExpense(false)} />}
      {funding && (
        <EquipmentFundingForm
          equipmentId={funding}
          onClose={() => setFunding(null)}
        />
      )}
      {planItem && (
        <PlanFundingForm planItemId={planItem} onClose={() => setPlanItem(null)} />
      )}
      {capitalEvent && (
        <CapitalEventForm
          event={capitalEvent === "new" ? undefined : capitalEvent}
          onClose={() => setCapitalEvent(null)}
        />
      )}
    </div>
  );
}

/** Asks what paid for one outlay. Used wherever something is bought. */
function FundingModal({
  title,
  name,
  amount,
  initial,
  saveLabel,
  onSave,
  onClose,
}: {
  title: string;
  name: string;
  amount: number;
  initial: Funding;
  saveLabel: string;
  onSave: (f: Funding) => void;
  onClose: () => void;
}) {
  const [funding, setFunding] = useState<Funding>(initial);
  return (
    <Modal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="os-btn"
            onClick={() => {
              onSave(funding);
              onClose();
            }}
          >
            {saveLabel} · {ZAR(amount)}
          </button>
        </>
      }
    >
      <p className="os-small os-muted">
        {name} cost {ZAR(amount)}. Only the part you take from the capital comes
        off what is left of it — the rest is recorded as your own money in the
        business, not as a cost against profit.
      </p>
      <FundingPicker amount={amount} value={funding} onChange={setFunding} />
    </Modal>
  );
}

/** Posting a piece of equipment, and saying what paid for it. */
function EquipmentFundingForm({
  equipmentId,
  onClose,
}: {
  equipmentId: string;
  onClose: () => void;
}) {
  const { vault, update } = useVault();
  const eq = vault?.equipment.find((e) => e.id === equipmentId);
  const posted = eq?.expenseId
    ? vault?.expenses.find((e) => e.id === eq.expenseId)
    : undefined;
  if (!vault || !eq) return null;

  return (
    <FundingModal
      title={posted ? `What paid for the ${eq.name}` : `Post the ${eq.name} to Finance`}
      name={eq.name}
      amount={eq.purchasePrice}
      initial={
        posted?.funding ?? (posted ? fundingOf(posted) : { capital: eq.purchasePrice })
      }
      saveLabel={posted ? "Save" : "Post"}
      onSave={(f) => update((d) => postEquipmentPurchase(d, equipmentId, f))}
      onClose={onClose}
    />
  );
}

/** Ticking off a line of the purchase plan, and saying what paid for it. */
function PlanFundingForm({
  planItemId,
  onClose,
}: {
  planItemId: string;
  onClose: () => void;
}) {
  const { vault, update } = useVault();
  const item = vault?.capitalPlan.find((p) => p.id === planItemId);
  if (!vault || !item) return null;

  return (
    <FundingModal
      title={`Mark ${item.name} bought`}
      name={item.name}
      amount={item.amount}
      initial={{ capital: item.amount }}
      saveLabel="Mark bought"
      onSave={(funding) =>
        update((d) => {
          const t = d.capitalPlan.find((x) => x.id === planItemId);
          if (!t || t.expenseId) return;
          const expense = {
            id: uid("exp_"),
            date: today(),
            category: t.category,
            description: t.name,
            amount: t.amount,
            funding,
          };
          d.expenses.push(expense);
          t.expenseId = expense.id;
          t.boughtOn = expense.date;
        })
      }
      onClose={onClose}
    />
  );
}

/** Money in and out of the business at the funding level, not the trading one. */
function CapitalEventForm({
  event,
  onClose,
}: {
  event?: CapitalEvent;
  onClose: () => void;
}) {
  const { update } = useVault();
  const [date, setDate] = useState(event?.date ?? today());
  const [kind, setKind] = useState<CapitalEvent["kind"]>(event?.kind ?? "owner");
  const [amount, setAmount] = useState(event?.amount ?? 0);
  const [note, setNote] = useState(event?.note ?? "");

  return (
    <Modal
      title={event ? "Edit entry" : "Money in or out"}
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="os-btn"
            disabled={!amount}
            onClick={() => {
              update((d) => {
                if (event) {
                  const t = d.capital.find((c) => c.id === event.id);
                  if (t) Object.assign(t, { date, kind, amount, note });
                } else {
                  d.capital.push({ id: uid("cap_"), date, kind, amount, note });
                }
              });
              onClose();
            }}
          >
            Save · {ZAR(amount)}
          </button>
        </>
      }
    >
      <div className="os-row">
        <Field label="Date">
          <input
            className="os-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="What is it">
          <select
            className="os-select"
            value={kind}
            onChange={(e) => setKind(e.target.value as CapitalEvent["kind"])}
          >
            <option value="owner">My own money in</option>
            <option value="loan">Loan capital received</option>
            <option value="repayment">Repayment out</option>
          </select>
        </Field>
        <Field label="Amount">
          <input
            className="os-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Note">
        <input
          className="os-input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            kind === "owner"
              ? "e.g. Balance of the blast freezer"
              : kind === "repayment"
                ? "e.g. Monthly repayment"
                : "e.g. Capital drawn down"
          }
        />
      </Field>
    </Modal>
  );
}

/**
 * Where the money for one outlay came from.
 *
 * Three sources, and the third needs no field of its own: whatever the loan
 * and the owner's pocket don't cover was paid for out of what the business has
 * made. The running total is always shown, because a split that doesn't add up
 * to the price is the mistake worth catching on the spot.
 */
function FundingPicker({
  amount,
  value,
  onChange,
}: {
  amount: number;
  value: Funding;
  onChange: (f: Funding) => void;
}) {
  const { vault } = useVault();
  const capital = Math.max(0, Math.min(value.capital ?? 0, amount));
  const owner = Math.max(0, Math.min(value.owner ?? 0, amount - capital));
  const trading = Math.max(0, amount - capital - owner);
  const pot = vault ? capitalRemaining(vault) : 0;

  return (
    <>
      <span className="os-field-label">How was it paid for?</span>
      <div className="os-stages" style={{ marginBottom: 10 }}>
        <button
          type="button"
          className="os-stage-pip"
          aria-pressed={capital === amount && amount > 0}
          onClick={() => onChange({ capital: amount, owner: 0 })}
        >
          All from the capital
        </button>
        <button
          type="button"
          className="os-stage-pip"
          aria-pressed={owner === amount && amount > 0}
          onClick={() => onChange({ capital: 0, owner: amount })}
        >
          All my own money
        </button>
        <button
          type="button"
          className="os-stage-pip"
          aria-pressed={trading === amount && amount > 0}
          onClick={() => onChange({ capital: 0, owner: 0 })}
        >
          All trading cash
        </button>
      </div>
      <div className="os-row">
        <Field label="From the capital">
          <input
            className="os-input"
            type="number"
            value={capital}
            onChange={(e) =>
              onChange({ capital: Number(e.target.value), owner: value.owner ?? 0 })
            }
          />
        </Field>
        <Field label="From my own pocket">
          <input
            className="os-input"
            type="number"
            value={owner}
            onChange={(e) =>
              onChange({ capital: value.capital ?? 0, owner: Number(e.target.value) })
            }
          />
        </Field>
      </div>
      <div className="os-split">
        <span>
          Capital <strong>{ZAR(capital)}</strong>
        </span>
        <span>
          Own money <strong>{ZAR(owner)}</strong>
        </span>
        <span>
          Trading cash <strong>{ZAR(trading)}</strong>
        </span>
      </div>
      {capital > pot && (
        <p className="os-small" style={{ color: "var(--os-caramel)" }}>
          That draws {ZAR(capital)} from the capital but only {ZAR(pot)} is
          unspent. Record the difference as your own money if you covered it.
        </p>
      )}
    </>
  );
}

function ExpenseForm({ onClose }: { onClose: () => void }) {
  const { vault, update } = useVault();
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [funding, setFunding] = useState<Funding>({});
  if (!vault) return null;

  return (
    <Modal
      title="Add an expense"
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="os-btn"
            disabled={!amount || !description}
            onClick={() => {
              update((d) =>
                d.expenses.push({
                  id: uid("exp_"),
                  date,
                  category,
                  description,
                  amount,
                  funding,
                })
              );
              onClose();
            }}
          >
            Save · {ZAR(amount)}
          </button>
        </>
      }
    >
      <div className="os-row">
        <Field label="Date">
          <input
            className="os-input"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </Field>
        <Field label="Category">
          <select
            className="os-select"
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          >
            {Object.entries(EXPENSE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Amount">
          <input
            className="os-input"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </Field>
      </div>
      <Field label="Description">
        <input
          className="os-input"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Field>
      <FundingPicker amount={amount} value={funding} onChange={setFunding} />
    </Modal>
  );
}
