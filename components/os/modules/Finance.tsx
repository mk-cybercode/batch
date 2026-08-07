"use client";

import { useState } from "react";
import { Check, Download, Plus, Trash2, Wrench } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Bars, Card, Chip, Empty, Field, Modal, SectionTitle, Spark } from "../ui";
import { postEquipmentPurchase } from "@/lib/os/actions";
import {
  capitalRemaining,
  expensesByCategory,
  financials,
  monthlySeries,
} from "@/lib/os/calc";
import { ZAR, dateLabel, download, monthLabel, pct, toCSV, today, uid } from "@/lib/os/format";
import { EXPENSE_LABEL, type ExpenseCategory } from "@/lib/os/types";

export default function Finance() {
  const { vault, update } = useVault();
  const [tab, setTab] = useState<"overview" | "expenses" | "capital" | "equipment">(
    "overview"
  );
  const [addingExpense, setAddingExpense] = useState(false);
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
        ["Date", "Category", "Description", "Amount", "Funded from", "Supplier"],
        ...[...v.expenses]
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((e) => [
            e.date,
            EXPENSE_LABEL[e.category],
            e.description,
            e.amount.toFixed(2),
            e.fundedFromCapital ? "Capital" : "Trading",
            v.suppliers.find((s) => s.id === e.supplierId)?.name ?? "",
          ]),
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
                          <Chip tone={e.fundedFromCapital ? "caramel" : undefined}>
                            {e.fundedFromCapital ? "Capital" : "Trading"}
                          </Chip>
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
          <div className="os-grid os-grid--3">
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
                              onClick={() =>
                                update((d) => {
                                  const t = d.capitalPlan.find((x) => x.id === p.id);
                                  if (!t || t.expenseId) return;
                                  const expense = {
                                    id: uid("exp_"),
                                    date: today(),
                                    category: t.category,
                                    description: t.name,
                                    amount: t.amount,
                                    fundedFromCapital: true,
                                  };
                                  d.expenses.push(expense);
                                  t.expenseId = expense.id;
                                  t.boughtOn = expense.date;
                                })
                              }
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

          <SectionTitle>Capital &amp; repayments</SectionTitle>
          <div className="os-list">
            {[...vault.capital]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((c) => (
                <div className="os-list-row" key={c.id}>
                  <Chip tone={c.kind === "repayment" ? "caramel" : "accent"}>
                    {c.kind === "loan" ? "Loan in" : c.kind === "owner" ? "Owner" : "Repayment"}
                  </Chip>
                  <span className="os-small os-muted">{dateLabel(c.date)}</span>
                  <span>{c.note}</span>
                  <strong className="os-push">{ZAR(c.amount)}</strong>
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
            <button
              className="os-btn os-btn--ghost os-btn--sm"
              onClick={() =>
                update((d) =>
                  d.capital.push({
                    id: uid("cap_"),
                    date: today(),
                    kind: "repayment",
                    amount: 12000,
                    note: "Monthly repayment",
                  })
                )
              }
            >
              <Plus size={14} /> Record repayment
            </button>
            <button
              className="os-btn os-btn--ghost os-btn--sm"
              onClick={() =>
                update((d) =>
                  d.capital.push({
                    id: uid("cap_"),
                    date: today(),
                    kind: "owner",
                    amount: 0,
                    note: "Owner contribution",
                  })
                )
              }
            >
              <Plus size={14} /> Owner contribution
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
                        <Chip tone="accent">Posted to Finance</Chip>
                      ) : (
                        <button
                          className="os-btn os-btn--ghost os-btn--sm"
                          onClick={() => update((d) => postEquipmentPurchase(d, eq.id))}
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
    </div>
  );
}

function ExpenseForm({ onClose }: { onClose: () => void }) {
  const { vault, update } = useVault();
  const [date, setDate] = useState(today());
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [fromCapital, setFromCapital] = useState(false);
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
                  fundedFromCapital: fromCapital,
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
      <Field label="Funded from">
        <select
          className="os-select"
          value={fromCapital ? "capital" : "trading"}
          onChange={(e) => setFromCapital(e.target.value === "capital")}
        >
          <option value="trading">Trading cash</option>
          <option value="capital">Phase 1 capital</option>
        </select>
      </Field>
    </Modal>
  );
}
