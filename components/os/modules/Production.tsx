"use client";

import { useState } from "react";
import { Factory, Plus, Trash2 } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Chip, Empty, Field, Modal } from "../ui";
import { postProduction, unpostProduction } from "@/lib/os/actions";
import { batchesAvailable, recipeCost } from "@/lib/os/calc";
import { ZAR, dateLabel, monthKey, today, uid } from "@/lib/os/format";

export default function Production() {
  const { vault, update } = useVault();
  const [logging, setLogging] = useState(false);
  if (!vault) return null;

  const runs = [...vault.production].sort((a, b) => b.date.localeCompare(a.date));
  const thisMonth = runs.filter((r) => monthKey(r.date) === monthKey(today()));
  const litres = runs.reduce((a, r) => a + r.litresProduced, 0);
  const waste = runs.reduce((a, r) => a + r.wasteLitres, 0);
  const labour = runs.reduce((a, r) => a + r.labourMinutes, 0);
  const downtime = runs.reduce((a, r) => a + r.downtimeMinutes, 0);

  return (
    <div className="os-stack">
      <div className="os-flex">
        <div className="os-grid os-grid--4" style={{ flex: 1 }}>
          <Card>
            <div className="os-stat-label">Litres produced</div>
            <div className="os-stat-value" style={{ fontSize: 23 }}>
              {litres.toFixed(0)} L
            </div>
            <div className="os-stat-sub">
              {thisMonth.reduce((a, r) => a + r.litresProduced, 0).toFixed(0)} L this month
            </div>
          </Card>
          <Card>
            <div className="os-stat-label">Waste</div>
            <div className="os-stat-value" style={{ fontSize: 23 }}>
              {waste.toFixed(1)} L
            </div>
            <div className="os-stat-sub">
              {litres ? ((waste / litres) * 100).toFixed(1) : "0"}% of output
            </div>
          </Card>
          <Card>
            <div className="os-stat-label">Labour time</div>
            <div className="os-stat-value" style={{ fontSize: 23 }}>
              {(labour / 60).toFixed(1)} h
            </div>
            <div className="os-stat-sub">
              {litres ? (labour / 60 / litres).toFixed(2) : "0"} h per litre
            </div>
          </Card>
          <Card>
            <div className="os-stat-label">Downtime</div>
            <div className="os-stat-value" style={{ fontSize: 23 }}>
              {(downtime / 60).toFixed(1)} h
            </div>
            <div className="os-stat-sub">{runs.length} runs logged</div>
          </Card>
        </div>
      </div>

      <div className="os-flex">
        <strong>Production runs</strong>
        <button className="os-btn os-right" onClick={() => setLogging(true)}>
          <Factory size={15} /> Log a run
        </button>
      </div>

      {runs.length ? (
        <div className="os-table-wrap">
          <table className="os-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Recipe</th>
                <th className="os-num">Batches</th>
                <th className="os-num">Litres</th>
                <th className="os-num">Units</th>
                <th className="os-num">Waste</th>
                <th className="os-num">Labour</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const recipe = vault.recipes.find((x) => x.id === r.recipeId);
                return (
                  <tr key={r.id}>
                    <td>{dateLabel(r.date)}</td>
                    <td>
                      {recipe ? `${recipe.name} v${recipe.version}` : "—"}
                    </td>
                    <td className="os-num">{r.batches}</td>
                    <td className="os-num">{r.litresProduced}</td>
                    <td className="os-num">{r.unitsProduced}</td>
                    <td className="os-num">{r.wasteLitres}</td>
                    <td className="os-num">{r.labourMinutes} min</td>
                    <td>
                      <Chip tone={r.posted ? "accent" : undefined}>
                        {r.posted ? "Posted" : "Draft"}
                      </Chip>
                    </td>
                    <td>
                      <button
                        className="os-btn os-btn--ghost os-btn--sm"
                        onClick={() =>
                          update((d) => {
                            const b = d.production.find((x) => x.id === r.id);
                            if (b) unpostProduction(d, b);
                            d.production = d.production.filter((x) => x.id !== r.id);
                          })
                        }
                        aria-label="Delete run"
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
          title="No production logged"
          body="Logging a run draws the recipe's ingredients out of stock and books the finished units in at cost."
          action={
            <button className="os-btn" onClick={() => setLogging(true)}>
              <Plus size={15} /> Log a run
            </button>
          }
        />
      )}

      {logging && <RunForm onClose={() => setLogging(false)} />}
    </div>
  );
}

function RunForm({ onClose }: { onClose: () => void }) {
  const { vault, update } = useVault();
  const producible = vault?.recipes.filter((r) => r.stage === "approved" || r.stage === "testing") ?? [];
  const [recipeId, setRecipeId] = useState(producible[0]?.id ?? "");
  const [date, setDate] = useState(today());
  const [batches, setBatches] = useState(1);
  const [waste, setWaste] = useState(0);
  const [labour, setLabour] = useState(60);
  const [downtime, setDowntime] = useState(0);
  const [notes, setNotes] = useState("");
  if (!vault) return null;

  const recipe = vault.recipes.find((r) => r.id === recipeId);
  const available = recipe ? batchesAvailable(vault, recipe) : 0;
  const litres = (recipe?.yieldLitres ?? 0) * batches - waste;
  const units = Math.max(
    0,
    Math.round((recipe?.outputUnits ?? 0) * batches * (waste && recipe?.yieldLitres ? 1 - waste / (recipe.yieldLitres * batches) : 1))
  );
  const cost = recipe ? recipeCost(vault, recipe).totalCost * batches : 0;
  const short = recipe ? batches > available : false;

  function save() {
    if (!recipe) return;
    const run = {
      id: uid("prd_"),
      date,
      recipeId,
      batches,
      litresProduced: Math.max(0, litres),
      unitsProduced: units,
      wasteLitres: waste,
      labourMinutes: labour,
      downtimeMinutes: downtime,
      notes,
    };
    update((d) => {
      d.production.push(run);
      const created = d.production.find((x) => x.id === run.id)!;
      postProduction(d, created);
    });
    onClose();
  }

  return (
    <Modal
      title="Log a production run"
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="os-btn" onClick={save} disabled={!recipe}>
            Post run
          </button>
        </>
      }
    >
      {!producible.length ? (
        <p className="os-muted">
          No recipes are ready to produce. Move a recipe to Testing or Approved
          first.
        </p>
      ) : (
        <>
          <div className="os-row">
            <Field label="Recipe">
              <select
                className="os-select"
                value={recipeId}
                onChange={(e) => setRecipeId(e.target.value)}
              >
                {producible.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} v{r.version}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                className="os-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
            <Field label={`Batches (stock supports ${available})`}>
              <input
                className="os-input"
                type="number"
                min={1}
                value={batches}
                onChange={(e) => setBatches(Number(e.target.value))}
              />
            </Field>
          </div>
          <div className="os-row">
            <Field label="Waste (litres)">
              <input
                className="os-input"
                type="number"
                step="0.1"
                value={waste}
                onChange={(e) => setWaste(Number(e.target.value))}
              />
            </Field>
            <Field label="Labour (minutes)">
              <input
                className="os-input"
                type="number"
                value={labour}
                onChange={(e) => setLabour(Number(e.target.value))}
              />
            </Field>
            <Field label="Downtime (minutes)">
              <input
                className="os-input"
                type="number"
                value={downtime}
                onChange={(e) => setDowntime(Number(e.target.value))}
              />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              className="os-textarea"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>

          <Card>
            <div className="os-grid os-grid--3">
              <div>
                <div className="os-stat-label">Yields</div>
                <div className="os-stat-value" style={{ fontSize: 20 }}>
                  {Math.max(0, litres).toFixed(1)} L
                </div>
                <div className="os-stat-sub">{units} units</div>
              </div>
              <div>
                <div className="os-stat-label">Ingredient cost</div>
                <div className="os-stat-value" style={{ fontSize: 20 }}>
                  {ZAR(cost)}
                </div>
                <div className="os-stat-sub">drawn from stock</div>
              </div>
              <div>
                <div className="os-stat-label">Blast freeze</div>
                <div className="os-stat-value" style={{ fontSize: 20 }}>
                  {((recipe?.blastFreezeMinutes ?? 0) / 60).toFixed(1)} h
                </div>
                <div className="os-stat-sub">before it can be sold</div>
              </div>
            </div>
            {short && (
              <p className="os-small" style={{ color: "var(--os-danger)", marginTop: 10 }}>
                Stock only supports {available} batch{available === 1 ? "" : "es"} —
                posting this will take the shortfall to zero.
              </p>
            )}
          </Card>
        </>
      )}
    </Modal>
  );
}
