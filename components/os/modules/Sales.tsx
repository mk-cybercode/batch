"use client";

import { useState } from "react";
import { Download, Plus, Trash2, Users } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Bars, Card, Chip, Empty, Field, Modal, SectionTitle } from "../ui";
import { postSale, unpostSale } from "@/lib/os/actions";
import {
  bestSellers,
  customerTotals,
  financials,
  salesByChannel,
} from "@/lib/os/calc";
import { ZAR, dateLabel, download, pct, toCSV, today, uid } from "@/lib/os/format";
import {
  CHANNEL_LABEL,
  type CustomerType,
  type SaleLine,
  type SalesChannel,
} from "@/lib/os/types";

const CHANNELS = Object.keys(CHANNEL_LABEL) as SalesChannel[];
const CUSTOMER_TYPES: CustomerType[] = [
  "stockist",
  "cafe",
  "hotel",
  "restaurant",
  "wholesale",
  "private",
];
const TYPE_LABEL: Record<CustomerType, string> = {
  stockist: "Retail stockist",
  cafe: "Café",
  hotel: "Hotel",
  restaurant: "Restaurant",
  wholesale: "Wholesale",
  private: "Private / event",
};

export default function Sales() {
  const { vault, update } = useVault();
  const [tab, setTab] = useState<"sales" | "customers">("sales");
  const [selling, setSelling] = useState(false);
  if (!vault) return null;
  /* Narrowing doesn't reach into the callbacks below, so bind it once. */
  const v = vault;

  const f = financials(vault);
  const channels = salesByChannel(vault);
  const sellers = bestSellers(vault, 6);
  const rows = [...vault.sales].sort((a, b) => b.date.localeCompare(a.date));

  function exportSales() {
    download(
      `batch-sales-${today()}.csv`,
      toCSV([
        ["Date", "Channel", "Customer", "Product", "Qty", "Unit price", "Unit cost", "Revenue", "Gross profit", "Payment"],
        ...rows.flatMap((s) =>
          s.lines.map((l) => [
            s.date,
            CHANNEL_LABEL[s.channel],
            v.customers.find((c) => c.id === s.customerId)?.name ?? "",
            v.inventory.find((i) => i.id === l.itemId)?.name ?? "",
            l.qty,
            l.unitPrice.toFixed(2),
            l.unitCost.toFixed(2),
            (l.qty * l.unitPrice).toFixed(2),
            (l.qty * (l.unitPrice - l.unitCost)).toFixed(2),
            s.paymentMethod,
          ])
        ),
      ])
    );
  }

  return (
    <div className="os-stack">
      <div className="os-flex">
        <div className="os-stages">
          {(["sales", "customers"] as const).map((t) => (
            <button
              key={t}
              className="os-stage-pip"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t === "sales" ? "Sales" : "Customers"}
            </button>
          ))}
        </div>
        <div className="os-flex os-right">
          <button className="os-btn os-btn--ghost os-btn--sm" onClick={exportSales}>
            <Download size={14} /> CSV
          </button>
          <button className="os-btn" onClick={() => setSelling(true)}>
            <Plus size={15} /> Record sale
          </button>
        </div>
      </div>

      {tab === "sales" && (
        <>
          <div className="os-grid os-grid--4">
            <Card>
              <div className="os-stat-label">Revenue</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>{ZAR(f.revenue)}</div>
            </Card>
            <Card>
              <div className="os-stat-label">Gross profit</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>{ZAR(f.grossProfit)}</div>
              <div className="os-stat-sub">{pct(f.grossMargin)} margin</div>
            </Card>
            <Card>
              <div className="os-stat-label">Units sold</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>
                {vault.sales.reduce((a, s) => a + s.lines.reduce((b, l) => b + l.qty, 0), 0)}
              </div>
            </Card>
            <Card>
              <div className="os-stat-label">Orders</div>
              <div className="os-stat-value" style={{ fontSize: 23 }}>{vault.sales.length}</div>
            </Card>
          </div>

          <div className="os-grid os-grid--2">
            <Card pad>
              <strong>By channel</strong>
              <div style={{ marginTop: 12 }}>
                {channels.length ? (
                  <Bars
                    rows={channels.map(([c, t]) => ({
                      label: CHANNEL_LABEL[c],
                      value: t.revenue,
                    }))}
                  />
                ) : (
                  <p className="os-muted os-small">Nothing sold yet.</p>
                )}
              </div>
            </Card>
            <Card pad>
              <strong>Best sellers</strong>
              <div style={{ marginTop: 12 }}>
                {sellers.length ? (
                  <Bars rows={sellers.map((s) => ({ label: s.name, value: s.revenue }))} />
                ) : (
                  <p className="os-muted os-small">Nothing sold yet.</p>
                )}
              </div>
            </Card>
          </div>

          {rows.length ? (
            <div className="os-table-wrap">
              <table className="os-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Channel</th>
                    <th>Customer</th>
                    <th>Products</th>
                    <th className="os-num">Revenue</th>
                    <th className="os-num">Gross</th>
                    <th className="os-num">Net</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => {
                    const rev = s.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
                    const cost = s.lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
                    return (
                      <tr key={s.id}>
                        <td>{dateLabel(s.date)}</td>
                        <td>
                          <Chip>{CHANNEL_LABEL[s.channel]}</Chip>
                        </td>
                        <td>
                          {vault.customers.find((c) => c.id === s.customerId)?.name ?? "—"}
                        </td>
                        <td className="os-small os-muted">
                          {s.lines
                            .map(
                              (l) =>
                                `${vault.inventory.find((i) => i.id === l.itemId)?.name ?? "?"} ×${l.qty}`
                            )
                            .join(", ")}
                        </td>
                        <td className="os-num">{ZAR(rev)}</td>
                        <td className="os-num">{ZAR(rev - cost)}</td>
                        <td className="os-num">{ZAR(rev - cost - s.channelCost)}</td>
                        <td>
                          <button
                            className="os-btn os-btn--ghost os-btn--sm"
                            onClick={() =>
                              update((d) => {
                                const t = d.sales.find((x) => x.id === s.id);
                                if (t) unpostSale(d, t);
                                d.sales = d.sales.filter((x) => x.id !== s.id);
                              })
                            }
                            aria-label="Delete sale"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No sales yet"
              body="Recording a sale draws finished stock down and posts the revenue and margin to Finance."
              action={
                <button className="os-btn" onClick={() => setSelling(true)}>
                  <Plus size={15} /> Record sale
                </button>
              }
            />
          )}
        </>
      )}

      {tab === "customers" && (
        <>
          {vault.customers.length ? (
            <div className="os-grid os-grid--2">
              {vault.customers.map((c) => {
                const t = customerTotals(vault, c.id);
                const set = (fn: (x: typeof c) => void) =>
                  update((d) => {
                    const x = d.customers.find((y) => y.id === c.id);
                    if (x) fn(x);
                  });
                return (
                  <Card key={c.id}>
                    <div className="os-row">
                      <Field label="Name">
                        <input
                          className="os-input"
                          value={c.name}
                          onChange={(e) => set((x) => void (x.name = e.target.value))}
                        />
                      </Field>
                      <Field label="Type">
                        <select
                          className="os-select"
                          value={c.type}
                          onChange={(e) =>
                            set((x) => void (x.type = e.target.value as CustomerType))
                          }
                        >
                          {CUSTOMER_TYPES.map((k) => (
                            <option key={k} value={k}>
                              {TYPE_LABEL[k]}
                            </option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <div className="os-row">
                      <Field label="Contact">
                        <input
                          className="os-input"
                          value={c.contact ?? ""}
                          onChange={(e) => set((x) => void (x.contact = e.target.value))}
                        />
                      </Field>
                      <Field label="Phone">
                        <input
                          className="os-input"
                          value={c.phone ?? ""}
                          onChange={(e) => set((x) => void (x.phone = e.target.value))}
                        />
                      </Field>
                      <Field label="Follow up on">
                        <input
                          className="os-input"
                          type="date"
                          value={c.followUpOn ?? ""}
                          onChange={(e) => set((x) => void (x.followUpOn = e.target.value))}
                        />
                      </Field>
                    </div>
                    <Field label="Notes">
                      <textarea
                        className="os-textarea"
                        value={c.notes ?? ""}
                        onChange={(e) => set((x) => void (x.notes = e.target.value))}
                      />
                    </Field>
                    <div className="os-flex os-small os-muted">
                      <span>{t.orders} orders</span>
                      <span>·</span>
                      <span>{ZAR(t.revenue)} total</span>
                      <span>·</span>
                      <span>{ZAR(t.average)} average</span>
                      {t.lastOrder && <span>· last {dateLabel(t.lastOrder)}</span>}
                      <button
                        className="os-btn os-btn--ghost os-btn--sm os-right"
                        onClick={() =>
                          update((d) => void (d.customers = d.customers.filter((x) => x.id !== c.id)))
                        }
                        aria-label="Delete customer"
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
              title="No customers yet"
              body="Stockists, cafés, hotels and wholesale buyers live here, with their order history attached."
            />
          )}
          <button
            className="os-btn os-btn--ghost os-btn--sm"
            onClick={() =>
              update((d) =>
                d.customers.push({ id: uid("cus_"), name: "New customer", type: "stockist" })
              )
            }
          >
            <Users size={14} /> Add customer
          </button>
        </>
      )}

      {selling && <SaleForm onClose={() => setSelling(false)} />}
    </div>
  );
}

function SaleForm({ onClose }: { onClose: () => void }) {
  const { vault, update } = useVault();
  const [date, setDate] = useState(today());
  const [channel, setChannel] = useState<SalesChannel>("direct");
  const [customerId, setCustomerId] = useState("");
  const [channelCost, setChannelCost] = useState(0);
  const [payment, setPayment] = useState<"cash" | "card" | "eft" | "platform">("cash");
  const [lines, setLines] = useState<SaleLine[]>([]);
  if (!vault) return null;

  const finished = vault.inventory.filter((i) => i.category === "finished" && !i.archived);

  function addLine() {
    const item = finished[0];
    if (!item) return;
    const recipe = vault!.recipes.find((r) => r.outputItemId === item.id);
    setLines([
      ...lines,
      {
        itemId: item.id,
        qty: 1,
        unitPrice: recipe?.sellingPrice ?? 0,
        unitCost: item.unitCost,
      },
    ]);
  }

  const revenue = lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
  const cost = lines.reduce((a, l) => a + l.qty * l.unitCost, 0);

  function save() {
    const clean = lines.filter((l) => l.itemId && l.qty > 0);
    if (!clean.length) return;
    const sale = {
      id: uid("sal_"),
      date,
      channel,
      customerId: customerId || undefined,
      lines: clean,
      channelCost,
      paymentMethod: payment,
    };
    update((d) => {
      d.sales.push(sale);
      const created = d.sales.find((x) => x.id === sale.id)!;
      postSale(d, created);
    });
    onClose();
  }

  return (
    <Modal
      title="Record a sale"
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="os-btn" onClick={save} disabled={!lines.length}>
            Save · {ZAR(revenue)}
          </button>
        </>
      }
    >
      {!finished.length ? (
        <p className="os-muted">
          There is no finished stock to sell yet. Log a production run first, or add
          a finished-stock item in Inventory.
        </p>
      ) : (
        <>
          <div className="os-row">
            <Field label="Date">
              <input
                className="os-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label="Channel">
              <select
                className="os-select"
                value={channel}
                onChange={(e) => setChannel(e.target.value as SalesChannel)}
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Customer">
              <select
                className="os-select"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
              >
                <option value="">—</option>
                {vault.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="os-row">
            <Field label="Channel cost (commission, stall, delivery)">
              <input
                className="os-input"
                type="number"
                value={channelCost}
                onChange={(e) => setChannelCost(Number(e.target.value))}
              />
            </Field>
            <Field label="Payment">
              <select
                className="os-select"
                value={payment}
                onChange={(e) => setPayment(e.target.value as typeof payment)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="eft">EFT</option>
                <option value="platform">Platform</option>
              </select>
            </Field>
          </div>

          <SectionTitle>Lines</SectionTitle>
          {lines.map((l, idx) => {
            const item = vault.inventory.find((i) => i.id === l.itemId);
            return (
              <div className="os-row" key={idx}>
                <select
                  className="os-select"
                  value={l.itemId}
                  onChange={(e) => {
                    const it = vault.inventory.find((i) => i.id === e.target.value);
                    setLines(
                      lines.map((x, i) =>
                        i === idx
                          ? { ...x, itemId: e.target.value, unitCost: it?.unitCost ?? 0 }
                          : x
                      )
                    );
                  }}
                >
                  {finished.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.stock} in stock)
                    </option>
                  ))}
                </select>
                <input
                  className="os-input"
                  type="number"
                  value={l.qty}
                  onChange={(e) =>
                    setLines(lines.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))
                  }
                />
                <input
                  className="os-input"
                  type="number"
                  value={l.unitPrice}
                  onChange={(e) =>
                    setLines(
                      lines.map((x, i) => (i === idx ? { ...x, unitPrice: Number(e.target.value) } : x))
                    )
                  }
                />
                <span className="os-shrink os-small os-muted" style={{ minWidth: 78 }}>
                  cost {ZAR(l.unitCost, 2)}
                </span>
                <button
                  className="os-btn os-btn--ghost os-btn--sm os-shrink"
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                  aria-label="Remove line"
                >
                  <Trash2 size={13} />
                </button>
                {item && l.qty > item.stock && (
                  <span className="os-small" style={{ color: "var(--os-danger)" }}>
                    only {item.stock} in stock
                  </span>
                )}
              </div>
            );
          })}
          <button className="os-btn os-btn--ghost os-btn--sm" onClick={addLine}>
            <Plus size={13} /> Add line
          </button>

          <Card style={{ marginTop: 14 }}>
            <div className="os-grid os-grid--3">
              <div>
                <div className="os-stat-label">Revenue</div>
                <div className="os-stat-value" style={{ fontSize: 20 }}>{ZAR(revenue)}</div>
              </div>
              <div>
                <div className="os-stat-label">Gross profit</div>
                <div className="os-stat-value" style={{ fontSize: 20 }}>{ZAR(revenue - cost)}</div>
              </div>
              <div>
                <div className="os-stat-label">Net of channel cost</div>
                <div className="os-stat-value" style={{ fontSize: 20 }}>
                  {ZAR(revenue - cost - channelCost)}
                </div>
              </div>
            </div>
          </Card>
        </>
      )}
    </Modal>
  );
}
