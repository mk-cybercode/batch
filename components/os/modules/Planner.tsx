"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Chip, Field, Modal } from "../ui";
import { addDays, dateLabel, today, uid } from "@/lib/os/format";
import type { PlanItem, PlanKind } from "@/lib/os/types";

const KIND_LABEL: Record<PlanKind, string> = {
  task: "Task",
  production: "Production",
  event: "Event / market",
  marketing: "Marketing",
  purchase: "Purchase",
  repayment: "Loan repayment",
  milestone: "Milestone",
};

type View = "month" | "week" | "list";

export default function Planner() {
  const { vault, update } = useVault();
  const [cursor, setCursor] = useState(() => new Date());
  const [view, setView] = useState<View>("month");
  const [editing, setEditing] = useState<PlanItem | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    /* Weeks start on Monday. */
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        iso: d.toISOString().slice(0, 10),
        day: d.getDate(),
        inMonth: d.getMonth() === cursor.getMonth(),
      };
    });
  }, [cursor]);

  const weekCells = useMemo(() => {
    const start = new Date(cursor);
    start.setDate(cursor.getDate() - ((cursor.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { iso: d.toISOString().slice(0, 10), day: d.getDate(), inMonth: true };
    });
  }, [cursor]);

  if (!vault) return null;

  /** Recurring items are expanded for display only — one record, many dates. */
  const occurrences = useMemo(() => {
    const map = new Map<string, PlanItem[]>();
    const horizonStart = cells[0]?.iso ?? today();
    const horizonEnd = cells.at(-1)?.iso ?? today();
    for (const p of vault.plan) {
      const push = (iso: string) => {
        if (iso < horizonStart || iso > horizonEnd) return;
        map.set(iso, [...(map.get(iso) ?? []), p]);
      };
      push(p.date);
      if (p.repeatWeeks && p.repeatWeeks > 0) {
        let next = addDays(p.date, p.repeatWeeks * 7);
        for (let i = 0; i < 60 && next <= horizonEnd; i++) {
          push(next);
          next = addDays(next, p.repeatWeeks * 7);
        }
      }
    }
    return map;
  }, [vault.plan, cells]);

  const grid = view === "week" ? weekCells : cells;
  const todayIso = today();

  function move(id: string, to: string) {
    update((d) => {
      const p = d.plan.find((x) => x.id === id);
      if (p) p.date = to;
    });
  }

  const upcoming = [...vault.plan]
    .filter((p) => !p.done)
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="os-stack">
      <div className="os-flex">
        <div className="os-stages">
          {(["month", "week", "list"] as View[]).map((v) => (
            <button
              key={v}
              className="os-stage-pip"
              aria-pressed={view === v}
              onClick={() => setView(v)}
            >
              {v === "month" ? "Month" : v === "week" ? "Week" : "List"}
            </button>
          ))}
        </div>
        {view !== "list" && (
          <div className="os-flex">
            <button
              className="os-btn os-btn--ghost os-btn--sm"
              onClick={() =>
                setCursor((c) => {
                  const n = new Date(c);
                  view === "week" ? n.setDate(c.getDate() - 7) : n.setMonth(c.getMonth() - 1);
                  return n;
                })
              }
              aria-label="Previous"
            >
              <ChevronLeft size={14} />
            </button>
            <strong style={{ minWidth: 140, textAlign: "center" }}>
              {cursor.toLocaleDateString("en-ZA", { month: "long", year: "numeric" })}
            </strong>
            <button
              className="os-btn os-btn--ghost os-btn--sm"
              onClick={() =>
                setCursor((c) => {
                  const n = new Date(c);
                  view === "week" ? n.setDate(c.getDate() + 7) : n.setMonth(c.getMonth() + 1);
                  return n;
                })
              }
              aria-label="Next"
            >
              <ChevronRight size={14} />
            </button>
            <button className="os-btn os-btn--ghost os-btn--sm" onClick={() => setCursor(new Date())}>
              Today
            </button>
          </div>
        )}
        <button
          className="os-btn os-right"
          onClick={() =>
            setEditing({
              id: uid("pl_"),
              date: todayIso,
              title: "",
              kind: "task",
            })
          }
        >
          <Plus size={15} /> Add
        </button>
      </div>

      {view !== "list" ? (
        <Card>
          <div className="os-cal" style={{ marginBottom: 6 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div className="os-cal-head" key={d}>
                {d}
              </div>
            ))}
          </div>
          <div className="os-cal">
            {grid.map((c) => (
              <div
                key={c.iso}
                className={`os-cal-cell${c.iso === todayIso ? " is-today" : ""}${
                  !c.inMonth ? " is-dim" : ""
                }${dragOver === c.iso ? " is-drop" : ""}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(c.iso);
                }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(null);
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) move(id, c.iso);
                }}
                onDoubleClick={() =>
                  setEditing({ id: uid("pl_"), date: c.iso, title: "", kind: "task" })
                }
              >
                <span className="os-cal-date">{c.day}</span>
                {(occurrences.get(c.iso) ?? []).map((p, i) => (
                  <div
                    key={`${p.id}-${i}`}
                    className={`os-cal-item${p.done ? " is-done" : ""}`}
                    data-kind={p.kind}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", p.id)}
                    onClick={() => setEditing(p)}
                    title={p.title}
                  >
                    {p.title}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="os-small os-muted" style={{ marginTop: 12 }}>
            Drag to reschedule · double-click a day to add · click an item to edit.
          </p>
        </Card>
      ) : (
        <div className="os-list">
          {upcoming.map((p) => (
            <div className="os-list-row" key={p.id}>
              <input
                type="checkbox"
                checked={!!p.done}
                onChange={(e) =>
                  update((d) => {
                    const t = d.plan.find((x) => x.id === p.id);
                    if (t) t.done = e.target.checked;
                  })
                }
              />
              <Chip>{KIND_LABEL[p.kind]}</Chip>
              <span className={p.date < todayIso ? "os-neg" : "os-muted"}>
                {dateLabel(p.date)}
              </span>
              <strong>{p.title}</strong>
              <button
                className="os-btn os-btn--ghost os-btn--sm os-push"
                onClick={() => setEditing(p)}
              >
                Edit
              </button>
            </div>
          ))}
          {!upcoming.length && <p className="os-muted os-small">Nothing planned.</p>}
        </div>
      )}

      {editing && (
        <PlanForm
          item={editing}
          onClose={() => setEditing(null)}
          isNew={!vault.plan.some((p) => p.id === editing.id)}
        />
      )}
    </div>
  );
}

function PlanForm({
  item,
  onClose,
  isNew,
}: {
  item: PlanItem;
  onClose: () => void;
  isNew: boolean;
}) {
  const { vault, update } = useVault();
  const [draft, setDraft] = useState<PlanItem>(item);
  if (!vault) return null;

  const linkOptions =
    draft.linkType === "recipe"
      ? vault.recipes.map((r) => ({ id: r.id, name: `${r.name} v${r.version}` }))
      : draft.linkType === "equipment"
        ? vault.equipment.map((e) => ({ id: e.id, name: e.name }))
        : draft.linkType === "customer"
          ? vault.customers.map((c) => ({ id: c.id, name: c.name }))
          : [];

  return (
    <Modal
      title={isNew ? "Add to the plan" : "Edit plan item"}
      onClose={onClose}
      footer={
        <>
          {!isNew && (
            <button
              className="os-btn os-btn--danger os-btn--sm"
              onClick={() => {
                update((d) => void (d.plan = d.plan.filter((p) => p.id !== draft.id)));
                onClose();
              }}
            >
              <Trash2 size={13} /> Delete
            </button>
          )}
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="os-btn"
            disabled={!draft.title.trim()}
            onClick={() => {
              update((d) => {
                const existing = d.plan.find((p) => p.id === draft.id);
                if (existing) Object.assign(existing, draft);
                else d.plan.push(draft);
              });
              onClose();
            }}
          >
            Save
          </button>
        </>
      }
    >
      <Field label="Title">
        <input
          className="os-input"
          autoFocus
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        />
      </Field>
      <div className="os-row">
        <Field label="Date">
          <input
            className="os-input"
            type="date"
            value={draft.date}
            onChange={(e) => setDraft({ ...draft, date: e.target.value })}
          />
        </Field>
        <Field label="Type">
          <select
            className="os-select"
            value={draft.kind}
            onChange={(e) => setDraft({ ...draft, kind: e.target.value as PlanKind })}
          >
            {Object.entries(KIND_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Repeat every (weeks)">
          <input
            className="os-input"
            type="number"
            min={0}
            value={draft.repeatWeeks ?? 0}
            onChange={(e) =>
              setDraft({ ...draft, repeatWeeks: Number(e.target.value) || undefined })
            }
          />
        </Field>
      </div>
      <div className="os-row">
        <Field label="Link to">
          <select
            className="os-select"
            value={draft.linkType ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                linkType: (e.target.value || undefined) as PlanItem["linkType"],
                linkId: undefined,
              })
            }
          >
            <option value="">— nothing —</option>
            <option value="recipe">Recipe</option>
            <option value="equipment">Equipment</option>
            <option value="customer">Customer</option>
          </select>
        </Field>
        {draft.linkType && (
          <Field label="Record">
            <select
              className="os-select"
              value={draft.linkId ?? ""}
              onChange={(e) => setDraft({ ...draft, linkId: e.target.value || undefined })}
            >
              <option value="">—</option>
              {linkOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </Field>
        )}
      </div>
      <Field label="Notes">
        <textarea
          className="os-textarea"
          value={draft.notes ?? ""}
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </Field>
      <label className="os-flex os-small">
        <input
          type="checkbox"
          checked={!!draft.done}
          onChange={(e) => setDraft({ ...draft, done: e.target.checked })}
        />
        Done
      </label>
    </Modal>
  );
}
