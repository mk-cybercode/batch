"use client";

import { useRef, useState } from "react";
import {
  Download,
  History,
  MinusCircle,
  Pencil,
  Plus,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Chip, Empty, Field, Modal, SectionTitle } from "../ui";
import {
  postPurchase,
  recordCount,
  recordUsage,
  unpostPurchase,
} from "@/lib/os/actions";
import { itemHistory, netMovements } from "@/lib/os/calc";
import { ZAR, dateLabel, download, toCSV, today, uid } from "@/lib/os/format";
import {
  EXPENSE_LABEL,
  MOVEMENT_LABEL,
  type ExpenseCategory,
  type InventoryCategory,
  type MovementKind,
  type Purchase,
  type PurchaseLine,
  type Unit,
} from "@/lib/os/types";

const CATEGORIES: InventoryCategory[] = [
  "ingredient",
  "packaging",
  "label",
  "consumable",
  "finished",
];
const CAT_LABEL: Record<InventoryCategory, string> = {
  ingredient: "Ingredient",
  packaging: "Packaging",
  label: "Label",
  consumable: "Consumable",
  finished: "Finished stock",
};
const UNITS: Unit[] = ["g", "kg", "ml", "L", "unit"];

export default function Inventory() {
  const { vault, update } = useVault();
  const [tab, setTab] = useState<"stock" | "purchases" | "suppliers">("stock");
  const [buying, setBuying] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [using, setUsing] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  if (!vault) return null;
  /* Narrowing doesn't reach into the callbacks below, so bind it once. */
  const v = vault;

  const items = vault.inventory.filter((i) => !i.archived);

  function addItem() {
    update((d) =>
      d.inventory.push({
        id: uid("inv_"),
        name: "New item",
        category: "ingredient",
        unit: "kg",
        unitCost: 0,
        stock: 0,
        reorderLevel: 0,
      })
    );
  }

  function exportStock() {
    download(
      `batch-inventory-${today()}.csv`,
      toCSV([
        ["Item", "Category", "Unit", "Unit cost", "Stock", "Value", "Reorder at", "Supplier"],
        ...items.map((i) => [
          i.name,
          CAT_LABEL[i.category],
          i.unit,
          i.unitCost.toFixed(2),
          i.stock,
          (i.stock * i.unitCost).toFixed(2),
          i.reorderLevel,
          v.suppliers.find((s) => s.id === i.supplierId)?.name ?? "",
        ]),
      ])
    );
  }

  return (
    <div className="os-stack">
      <div className="os-flex">
        <div className="os-stages">
          {(["stock", "purchases", "suppliers"] as const).map((t) => (
            <button
              key={t}
              className="os-stage-pip"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
            >
              {t === "stock" ? "Stock" : t === "purchases" ? "Purchases" : "Suppliers"}
            </button>
          ))}
        </div>
        <div className="os-flex os-right">
          <button className="os-btn os-btn--ghost os-btn--sm" onClick={exportStock}>
            <Download size={14} /> CSV
          </button>
          <button className="os-btn" onClick={() => setBuying(true)}>
            <ShoppingCart size={15} /> Record purchase
          </button>
        </div>
      </div>

      {tab === "stock" && (
        <>
          <div className="os-grid os-grid--3">
            <Card>
              <div className="os-stat-label">Stock value</div>
              <div className="os-stat-value" style={{ fontSize: 24 }}>
                {ZAR(items.reduce((a, i) => a + i.stock * i.unitCost, 0))}
              </div>
            </Card>
            <Card>
              <div className="os-stat-label">Items tracked</div>
              <div className="os-stat-value" style={{ fontSize: 24 }}>
                {items.length}
              </div>
            </Card>
            <Card>
              <div className="os-stat-label">Below reorder level</div>
              <div className="os-stat-value" style={{ fontSize: 24 }}>
                {items.filter((i) => i.reorderLevel > 0 && i.stock <= i.reorderLevel).length}
              </div>
            </Card>
          </div>

          <div className="os-table-wrap">
            <table className="os-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Category</th>
                  <th>Unit</th>
                  <th className="os-num">Unit cost</th>
                  <th className="os-num">Stock</th>
                  <th className="os-num">Value</th>
                  <th className="os-num">Reorder at</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => {
                  const set = (fn: (x: typeof i) => void) =>
                    update((d) => {
                      const t = d.inventory.find((x) => x.id === i.id);
                      if (t) fn(t);
                    });
                  const low = i.reorderLevel > 0 && i.stock <= i.reorderLevel;
                  return (
                    <tr key={i.id}>
                      <td>
                        <input
                          className="os-input"
                          style={{ minWidth: 150 }}
                          value={i.name}
                          onChange={(e) => set((x) => void (x.name = e.target.value))}
                        />
                      </td>
                      <td>
                        <select
                          className="os-select"
                          value={i.category}
                          onChange={(e) =>
                            set((x) => void (x.category = e.target.value as InventoryCategory))
                          }
                        >
                          {CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {CAT_LABEL[c]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className="os-select"
                          value={i.unit}
                          onChange={(e) => set((x) => void (x.unit = e.target.value as Unit))}
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="os-num">{ZAR(i.unitCost, 2)}</td>
                      <td className="os-num">
                        <button
                          className="os-btn os-btn--ghost os-btn--sm"
                          onClick={() => setHistoryFor(i.id)}
                          title="Where this stock came from"
                        >
                          <strong>{Number(i.stock.toFixed(2))}</strong>
                          <span className="os-muted os-small">{i.unit}</span>
                          <History size={12} />
                        </button>
                      </td>
                      <td className="os-num">{ZAR(i.stock * i.unitCost)}</td>
                      <td className="os-num">
                        <input
                          className="os-input os-num"
                          type="number"
                          style={{ width: 74 }}
                          value={i.reorderLevel}
                          onChange={(e) =>
                            set((x) => void (x.reorderLevel = Number(e.target.value)))
                          }
                        />
                      </td>
                      <td>
                        {low && <Chip tone="danger">Low</Chip>}{" "}
                        <button
                          className="os-btn os-btn--ghost os-btn--sm"
                          onClick={() => setUsing(i.id)}
                        >
                          <MinusCircle size={13} /> Use
                        </button>{" "}
                        <button
                          className="os-btn os-btn--ghost os-btn--sm"
                          onClick={() => set((x) => void (x.archived = true))}
                          aria-label="Archive item"
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
          <button className="os-btn os-btn--ghost os-btn--sm" onClick={addItem}>
            <Plus size={14} /> Add item
          </button>
          <p className="os-small os-muted">
            Stock can&rsquo;t be typed in directly. It rises when you record a
            purchase, and falls through production, sales, trial batches and the{" "}
            <strong>Use</strong> button — so every figure has a movement behind it.
            Unit cost is the weighted average of what you actually paid.
          </p>

          {vault.adjustments.length > 0 && (
            <>
              <SectionTitle>Recent stock movements</SectionTitle>
              <div className="os-list">
                {[...vault.adjustments]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 8)
                  .map((a) => {
                    const item = vault.inventory.find((i) => i.id === a.itemId);
                    return (
                      <div className="os-list-row" key={a.id}>
                        <Chip tone={a.kind === "trial" ? "accent" : undefined}>
                          {MOVEMENT_LABEL[a.kind]}
                        </Chip>
                        <strong>{item?.name ?? "—"}</strong>
                        <span className="os-small os-muted">
                          {a.from} → {a.to} {item?.unit}
                        </span>
                        <span className="os-small os-muted">{a.reason}</span>
                        <span className="os-small os-muted os-push">
                          {dateLabel(a.date)}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </>
      )}

      {tab === "purchases" && (
        <>
          {vault.purchases.length ? (
            <div className="os-table-wrap">
              <table className="os-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference</th>
                    <th>Supplier</th>
                    <th>Category</th>
                    <th>Lines</th>
                    <th className="os-num">Total</th>
                    <th>Funded</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...vault.purchases]
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .map((p) => (
                      <tr key={p.id}>
                        <td>{dateLabel(p.date)}</td>
                        <td>{p.reference || "—"}</td>
                        <td>
                          {vault.suppliers.find((s) => s.id === p.supplierId)?.name ?? "—"}
                        </td>
                        <td>{EXPENSE_LABEL[p.category]}</td>
                        <td className="os-small os-muted">
                          {p.lines
                            .map(
                              (l) =>
                                `${vault.inventory.find((i) => i.id === l.itemId)?.name ?? "?"} ×${l.qty}`
                            )
                            .join(", ")}
                        </td>
                        <td className="os-num">
                          {ZAR(p.lines.reduce((a, l) => a + l.lineTotal, 0))}
                        </td>
                        <td>
                          <Chip tone={p.fundedFromCapital ? "caramel" : undefined}>
                            {p.fundedFromCapital ? "Capital" : "Trading"}
                          </Chip>
                        </td>
                        <td>
                          <button
                            className="os-btn os-btn--ghost os-btn--sm"
                            onClick={() => setEditing(p)}
                          >
                            <Pencil size={13} /> Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No purchases recorded"
              body="Recording a purchase raises stock, re-averages unit cost and posts the expense to Finance in one step."
              action={
                <button className="os-btn" onClick={() => setBuying(true)}>
                  <ShoppingCart size={15} /> Record purchase
                </button>
              }
            />
          )}
        </>
      )}

      {tab === "suppliers" && (
        <>
          <div className="os-list">
            {vault.suppliers.map((s) => {
              const set = (fn: (x: typeof s) => void) =>
                update((d) => {
                  const t = d.suppliers.find((x) => x.id === s.id);
                  if (t) fn(t);
                });
              return (
                <Card key={s.id}>
                  <div className="os-row">
                    <Field label="Name">
                      <input
                        className="os-input"
                        value={s.name}
                        onChange={(e) => set((x) => void (x.name = e.target.value))}
                      />
                    </Field>
                    <Field label="Contact">
                      <input
                        className="os-input"
                        value={s.contact ?? ""}
                        onChange={(e) => set((x) => void (x.contact = e.target.value))}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        className="os-input"
                        value={s.email ?? ""}
                        onChange={(e) => set((x) => void (x.email = e.target.value))}
                      />
                    </Field>
                    <Field label="Phone">
                      <input
                        className="os-input"
                        value={s.phone ?? ""}
                        onChange={(e) => set((x) => void (x.phone = e.target.value))}
                      />
                    </Field>
                  </div>
                </Card>
              );
            })}
          </div>
          <button
            className="os-btn os-btn--ghost os-btn--sm"
            onClick={() =>
              update((d) => d.suppliers.push({ id: uid("sup_"), name: "New supplier" }))
            }
          >
            <Plus size={14} /> Add supplier
          </button>
        </>
      )}

      {buying && <PurchaseForm onClose={() => setBuying(false)} />}
      {editing && (
        <PurchaseForm purchase={editing} onClose={() => setEditing(null)} />
      )}
      {using && <UsageForm itemId={using} onClose={() => setUsing(null)} />}
      {historyFor && (
        <HistoryView itemId={historyFor} onClose={() => setHistoryFor(null)} />
      )}
    </div>
  );
}

/** Every event that moved this item, so an odd figure can be traced. */
function HistoryView({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { vault, update } = useVault();
  if (!vault) return null;
  const item = vault.inventory.find((i) => i.id === itemId);
  if (!item) return null;
  const rows = itemHistory(vault, itemId);
  const opening = rows.find((r) => r.opening);
  const net = netMovements(vault, itemId);

  return (
    <Modal title={`${item.name} — stock history`} onClose={onClose}>
      {rows.length ? (
        <div className="os-table-wrap">
          <table className="os-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>What</th>
                <th>Detail</th>
                <th className="os-num">Change</th>
                <th className="os-num">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.date ? dateLabel(r.date) : "—"}</td>
                  <td>
                    <Chip tone={r.delta > 0 ? "accent" : undefined}>{r.label}</Chip>
                  </td>
                  <td className="os-small os-muted">{r.detail}</td>
                  <td
                    className="os-num"
                    style={{ color: r.delta < 0 ? "var(--os-danger)" : undefined }}
                  >
                    {r.delta > 0 ? "+" : ""}
                    {Number(r.delta.toFixed(2))}
                  </td>
                  <td className="os-num">
                    <strong>{Number(r.balance.toFixed(2))}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="os-muted os-small">Nothing has moved this item yet.</p>
      )}
      {opening ? (
        <Card style={{ marginTop: 14 }}>
          <p className="os-small" style={{ marginTop: 0 }}>
            <strong>
              {Number(opening.delta.toFixed(2))} {item.unit}
            </strong>{" "}
            of this stock didn&rsquo;t come from a purchase — it&rsquo;s starter
            data the app shipped with, or a figure typed in before stock was
            locked down. Clearing it leaves only what you actually recorded.
          </p>
          <div className="os-flex">
            <button
              className="os-btn os-btn--sm"
              onClick={() => {
                update((d) => {
                  const t = d.inventory.find((i) => i.id === itemId);
                  if (t) t.stock = Math.max(0, net);
                });
                onClose();
              }}
            >
              Clear it — stock becomes {Number(Math.max(0, net).toFixed(2))}{" "}
              {item.unit}
            </button>
            <span className="os-small os-muted">
              Keeps every purchase and movement below.
            </span>
          </div>
        </Card>
      ) : (
        <p className="os-small os-muted" style={{ marginTop: 12 }}>
          Closing balance is {Number(item.stock.toFixed(2))} {item.unit} — every
          unit accounted for by the movements above.
        </p>
      )}
    </Modal>
  );
}

/** Records stock going out — a trial, something used or spoiled, or a count. */
function UsageForm({ itemId, onClose }: { itemId: string; onClose: () => void }) {
  const { vault, update } = useVault();
  const [kind, setKind] = useState<MovementKind>("usage");
  const [qty, setQty] = useState(0);
  const [counted, setCounted] = useState(0);
  const [reason, setReason] = useState("");
  const [recipeId, setRecipeId] = useState("");
  if (!vault) return null;

  const item = vault.inventory.find((i) => i.id === itemId);
  if (!item) return null;
  const isCount = kind === "count";
  const result = isCount ? counted : Math.max(0, item.stock - qty);

  return (
    <Modal
      title={`${item.name} — stock movement`}
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="os-btn"
            disabled={isCount ? false : qty <= 0}
            onClick={() => {
              update((d) => {
                if (isCount) {
                  recordCount(d, itemId, counted, reason || "Counted stock take");
                } else {
                  recordUsage(
                    d,
                    itemId,
                    qty,
                    kind,
                    reason ||
                      (kind === "trial" ? "Trial batch" : MOVEMENT_LABEL[kind]),
                    recipeId || undefined
                  );
                }
              });
              onClose();
            }}
          >
            Record
          </button>
        </>
      }
    >
      <Field label="What happened">
        <select
          className="os-select"
          value={kind}
          onChange={(e) => setKind(e.target.value as MovementKind)}
        >
          <option value="trial">Used in a trial batch</option>
          <option value="usage">Used</option>
          <option value="waste">Wasted or spoiled</option>
          <option value="count">Counted it — set the true figure</option>
        </select>
      </Field>

      {kind === "trial" && (
        <Field label="Which recipe (optional)">
          <select
            className="os-select"
            value={recipeId}
            onChange={(e) => setRecipeId(e.target.value)}
          >
            <option value="">—</option>
            {vault.recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} v{r.version}
              </option>
            ))}
          </select>
        </Field>
      )}

      <div className="os-row">
        {isCount ? (
          <Field label={`Counted stock (${item.unit})`}>
            <input
              className="os-input"
              type="number"
              step="0.01"
              min="0"
              value={counted}
              onChange={(e) => setCounted(Number(e.target.value))}
            />
          </Field>
        ) : (
          <Field label={`How much (${item.unit})`}>
            <input
              className="os-input"
              type="number"
              step="0.01"
              min="0"
              autoFocus
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
            />
          </Field>
        )}
        <Field label="Note">
          <input
            className="os-input"
            value={reason}
            placeholder={kind === "trial" ? "Second pistachio trial" : "Optional"}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
      </div>

      <Card>
        <span className="os-small">
          Stock goes from <strong>{Number(item.stock.toFixed(2))}</strong> to{" "}
          <strong>{Number(result.toFixed(2))}</strong> {item.unit}
          {!isCount && qty > 0 && (
            <> · {ZAR(qty * item.unitCost, 2)} of ingredients consumed</>
          )}
        </span>
      </Card>
    </Modal>
  );
}

function PurchaseForm({
  purchase,
  onClose,
}: {
  purchase?: Purchase;
  onClose: () => void;
}) {
  const { vault, update } = useVault();
  const editing = !!purchase;
  const [date, setDate] = useState(purchase?.date ?? today());
  const [supplierId, setSupplierId] = useState(purchase?.supplierId ?? "");
  const [reference, setReference] = useState(purchase?.reference ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(
    purchase?.category ?? "ingredients"
  );
  const [fromCapital, setFromCapital] = useState(
    purchase?.fundedFromCapital ?? true
  );
  const [lines, setLines] = useState<PurchaseLine[]>(
    purchase
      ? purchase.lines.map((l) => ({
          ...l,
          /* Older lines carried a bare quantity; treat it as loose units. */
          packs: l.packs ?? l.qty,
          packSize: l.packSize ?? 1,
        }))
      : [{ itemId: "", qty: 1, packs: 1, packSize: 1, lineTotal: 0 }]
  );
  const submitted = useRef(false);
  if (!vault) return null;

  const items = vault.inventory.filter((i) => !i.archived);
  const total = lines.reduce((a, l) => a + l.lineTotal, 0);
  const incomplete = lines.filter((l) => !l.itemId || l.lineTotal <= 0).length;

  /** Quantity received is always packs × size, in the item's own unit.
   *  The fallbacks must match what the inputs display, or a line the user
   *  never retyped saves as zero and silently disappears. */
  function resolvedQty(l: PurchaseLine) {
    const item = items.find((i) => i.id === l.itemId);
    const size = item?.unit === "unit" ? 1 : (l.packSize ?? 1);
    return (l.packs ?? 1) * size;
  }

  function save() {
    /* A second tap before the dialog closes would post the stock twice. */
    if (submitted.current) return;
    /* A line left on its defaults has no price — treat it as not filled in
       rather than quietly adding a unit of free stock. */
    const clean = lines
      .map((l) => ({ ...l, qty: resolvedQty(l) }))
      .filter((l) => l.itemId && l.qty > 0 && l.lineTotal > 0);
    if (!clean.length) return;
    submitted.current = true;
    const next = {
      id: purchase?.id ?? uid("pur_"),
      date,
      supplierId: supplierId || undefined,
      reference,
      lines: clean,
      category,
      fundedFromCapital: fromCapital,
    };
    update((d) => {
      if (purchase) {
        /* Roll back the original's stock and cost effect, then re-apply the
           edited version so inventory and the ledger stay in step. */
        const old = d.purchases.find((p) => p.id === purchase.id);
        if (old) unpostPurchase(d, old);
        d.purchases = d.purchases.filter((p) => p.id !== purchase.id);
      }
      d.purchases.push(next);
      postPurchase(d, next);
    });
    onClose();
  }

  function remove() {
    if (!purchase) return;
    update((d) => {
      const old = d.purchases.find((p) => p.id === purchase.id);
      if (old) unpostPurchase(d, old);
      d.purchases = d.purchases.filter((p) => p.id !== purchase.id);
    });
    onClose();
  }

  return (
    <Modal
      title={editing ? "Edit purchase" : "Record a purchase"}
      onClose={onClose}
      footer={
        <>
          {editing && (
            <button className="os-btn os-btn--danger os-btn--sm" onClick={remove}>
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="os-btn" onClick={save} disabled={!total}>
            {editing ? "Save changes" : "Save"} · {ZAR(total)}
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
        <Field label="Supplier">
          <select
            className="os-select"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
          >
            <option value="">—</option>
            {vault.suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reference">
          <input
            className="os-input"
            value={reference}
            placeholder="Invoice no."
            onChange={(e) => setReference(e.target.value)}
          />
        </Field>
      </div>
      <div className="os-row">
        <Field label="Expense category">
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
        <Field label="Funded from">
          <select
            className="os-select"
            value={fromCapital ? "capital" : "trading"}
            onChange={(e) => setFromCapital(e.target.value === "capital")}
          >
            <option value="capital">Phase 1 capital</option>
            <option value="trading">Trading cash</option>
          </select>
        </Field>
      </div>

      <SectionTitle>What you bought</SectionTitle>
      {lines.map((l, idx) => {
        const item = items.find((i) => i.id === l.itemId);
        const unit = item?.unit ?? "unit";
        /* Loose units need no pack size; bulk goods are bought as N × size. */
        const loose = unit === "unit";
        const packs = l.packs ?? 1;
        const packSize = loose ? 1 : (l.packSize ?? 1);
        const totalQty = packs * packSize;
        const each = totalQty > 0 ? l.lineTotal / totalQty : 0;
        const setLine = (patch: Partial<PurchaseLine>) =>
          setLines(lines.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
        return (
          <Card key={idx} style={{ marginBottom: 10 }}>
            <Field label="Item">
              <select
                className="os-select"
                value={l.itemId}
                onChange={(e) => setLine({ itemId: e.target.value })}
              >
                <option value="">— choose an item —</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name} ({i.unit})
                  </option>
                ))}
              </select>
            </Field>
            <div className="os-row">
              <Field label={loose ? "How many units" : "How many packs / bags"}>
                <input
                  className="os-input"
                  type="number"
                  step="1"
                  min="0"
                  value={packs}
                  onChange={(e) => setLine({ packs: Number(e.target.value) })}
                />
              </Field>
              {!loose && (
                <Field label={`Size of each (${unit})`}>
                  <input
                    className="os-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={packSize}
                    onChange={(e) => setLine({ packSize: Number(e.target.value) })}
                  />
                </Field>
              )}
              <Field label="Total price paid (R)">
                <input
                  className="os-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={l.lineTotal}
                  onChange={(e) => setLine({ lineTotal: Number(e.target.value) })}
                />
              </Field>
            </div>
            <div className="os-flex os-small os-muted">
              <span>
                {totalQty > 0 && l.lineTotal > 0 ? (
                  <>
                    Adds <strong>{totalQty}&nbsp;{unit}</strong> to stock ·{" "}
                    <strong>{ZAR(each, 2)}</strong> per {unit}
                  </>
                ) : loose ? (
                  "How many you bought, and the total you paid"
                ) : (
                  `e.g. 2 bags × 5 ${unit} = 10 ${unit}`
                )}
              </span>
              {lines.length > 1 && (
                <button
                  className="os-btn os-btn--ghost os-btn--sm os-right"
                  onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                >
                  <Trash2 size={13} /> Remove
                </button>
              )}
            </div>
          </Card>
        );
      })}
      <button
        className="os-btn os-btn--ghost os-btn--sm"
        onClick={() =>
          setLines([
            ...lines,
            { itemId: "", qty: 1, packs: 1, packSize: 1, lineTotal: 0 },
          ])
        }
      >
        <Plus size={13} /> Add another item
      </button>
      {incomplete > 0 && (
        <p className="os-small" style={{ marginTop: 12, color: "var(--os-caramel)" }}>
          {incomplete} line{incomplete === 1 ? "" : "s"} still {incomplete === 1 ? "needs" : "need"} an
          item and a price — {incomplete === 1 ? "it" : "they"} won&rsquo;t be saved.
        </p>
      )}
      <p className="os-small os-muted" style={{ marginTop: 12 }}>
        {editing
          ? `Saving reverses the original stock movement and re-applies the edited one. Total ${ZAR(total)}.`
          : `Saving raises stock, re-averages the unit cost used by recipes, and posts ${ZAR(total)} to Finance.`}
      </p>
    </Modal>
  );
}
