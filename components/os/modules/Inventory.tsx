"use client";

import { useState } from "react";
import { Download, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Chip, Empty, Field, Modal, SectionTitle } from "../ui";
import { postPurchase } from "@/lib/os/actions";
import { ZAR, dateLabel, download, toCSV, today, uid } from "@/lib/os/format";
import {
  EXPENSE_LABEL,
  type ExpenseCategory,
  type InventoryCategory,
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
                        <input
                          className="os-input os-num"
                          type="number"
                          style={{ width: 84 }}
                          value={i.stock}
                          onChange={(e) => set((x) => void (x.stock = Number(e.target.value)))}
                        />
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
            Unit cost is maintained automatically as a weighted average of what you
            actually pay — record purchases rather than editing it by hand.
          </p>
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
    </div>
  );
}

function PurchaseForm({ onClose }: { onClose: () => void }) {
  const { vault, update } = useVault();
  const [date, setDate] = useState(today());
  const [supplierId, setSupplierId] = useState("");
  const [reference, setReference] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("ingredients");
  const [fromCapital, setFromCapital] = useState(true);
  const [lines, setLines] = useState<PurchaseLine[]>([
    { itemId: "", qty: 1, lineTotal: 0 },
  ]);
  if (!vault) return null;

  const items = vault.inventory.filter((i) => !i.archived);
  const total = lines.reduce((a, l) => a + l.lineTotal, 0);

  function save() {
    const clean = lines.filter((l) => l.itemId && l.qty > 0);
    if (!clean.length) return;
    const purchase = {
      id: uid("pur_"),
      date,
      supplierId: supplierId || undefined,
      reference,
      lines: clean,
      category,
      fundedFromCapital: fromCapital,
    };
    update((d) => {
      d.purchases.push(purchase);
      postPurchase(d, purchase);
    });
    onClose();
  }

  return (
    <Modal
      title="Record a purchase"
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="os-btn" onClick={save} disabled={!total}>
            Save · {ZAR(total)}
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

      <SectionTitle>Lines</SectionTitle>
      {lines.map((l, idx) => (
        <div className="os-row" key={idx}>
          <select
            className="os-select"
            value={l.itemId}
            onChange={(e) =>
              setLines(lines.map((x, i) => (i === idx ? { ...x, itemId: e.target.value } : x)))
            }
          >
            <option value="">— item —</option>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.unit})
              </option>
            ))}
          </select>
          <input
            className="os-input"
            type="number"
            step="0.01"
            placeholder="Qty"
            value={l.qty}
            onChange={(e) =>
              setLines(lines.map((x, i) => (i === idx ? { ...x, qty: Number(e.target.value) } : x)))
            }
          />
          <input
            className="os-input"
            type="number"
            step="0.01"
            placeholder="Line total (R)"
            value={l.lineTotal}
            onChange={(e) =>
              setLines(
                lines.map((x, i) => (i === idx ? { ...x, lineTotal: Number(e.target.value) } : x))
              )
            }
          />
          <button
            className="os-btn os-btn--ghost os-btn--sm os-shrink"
            onClick={() => setLines(lines.filter((_, i) => i !== idx))}
            aria-label="Remove line"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}
      <button
        className="os-btn os-btn--ghost os-btn--sm"
        onClick={() => setLines([...lines, { itemId: "", qty: 1, lineTotal: 0 }])}
      >
        <Plus size={13} /> Add line
      </button>
      <p className="os-small os-muted" style={{ marginTop: 12 }}>
        Saving raises stock, re-averages the unit cost used by recipes, and posts{" "}
        {ZAR(total)} to Finance.
      </p>
    </Modal>
  );
}
