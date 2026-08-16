"use client";

import { useMemo, useRef, useState } from "react";
import {
  Beaker,
  FileDown,
  GitBranch,
  Lock,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Chip, Empty, Field, Modal, SectionTitle } from "../ui";
import type { ModuleProps } from "../Shell";
import { forkRecipe, recordTrial } from "@/lib/os/actions";
import { batchesAvailable, recipeCost, recipeFeedback } from "@/lib/os/calc";
import { ZAR, dateLabel, pct, today, uid } from "@/lib/os/format";
import {
  STAGE_LABEL,
  type Recipe,
  type RecipeStage,
  type Survey,
  type Unit,
} from "@/lib/os/types";

const STAGES: RecipeStage[] = ["idea", "trial", "testing", "approved", "archived"];
const UNITS: Unit[] = ["g", "kg", "ml", "L", "unit"];

/** Photos are downscaled before storage so the vault stays small. */
async function shrink(file: File, max = 900): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function Recipes({ onNavigate }: ModuleProps) {
  const { vault, update } = useVault();
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<RecipeStage | "all">("all");
  const [surveyFor, setSurveyFor] = useState<string | null>(null);

  const recipes = useMemo(() => {
    if (!vault) return [];
    return [...vault.recipes]
      .filter((r) => filter === "all" || r.stage === filter)
      .sort((a, b) => a.name.localeCompare(b.name) || b.version - a.version);
  }, [vault, filter]);

  if (!vault) return null;
  const open = vault.recipes.find((r) => r.id === openId) ?? null;

  function addRecipe() {
    const id = uid("rec_");
    update((d) => {
      d.recipes.push({
        id,
        name: "New recipe",
        version: 1,
        stage: "idea",
        yieldLitres: 8,
        outputUnits: 16,
        sellingPrice: 190,
        productionMinutes: 60,
        blastFreezeMinutes: 240,
        ingredients: [],
        quality: {
          appearance: "",
          texture: "",
          colour: "",
          melt: "",
          overrun: "",
          taste: "",
          customerFeedback: "",
          lessons: "",
        },
        photos: [],
        notes: "",
        createdAt: today(),
      });
    });
    setOpenId(id);
  }

  return (
    <div className="os-stack">
      <div className="os-flex">
        <div className="os-stages">
          <button
            className="os-stage-pip"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All ({vault.recipes.length})
          </button>
          {STAGES.map((s) => (
            <button
              key={s}
              className="os-stage-pip"
              aria-pressed={filter === s}
              onClick={() => setFilter(s)}
            >
              {STAGE_LABEL[s]} ({vault.recipes.filter((r) => r.stage === s).length})
            </button>
          ))}
        </div>
        <button className="os-btn os-right" onClick={addRecipe}>
          <Plus size={15} /> New recipe
        </button>
      </div>

      {recipes.length ? (
        <div className="os-grid os-grid--3">
          {recipes.map((r) => {
            const cost = recipeCost(vault, r);
            const fb = recipeFeedback(vault, r.id);
            const cover = r.photos.find((p) => p.kind === "finished") ?? r.photos[0];
            return (
              <Card key={r.id}>
                <button
                  onClick={() => setOpenId(r.id)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "block",
                    width: "100%",
                  }}
                >
                  {cover && (
                    <div
                      className="os-photo"
                      style={{ aspectRatio: "16/9", marginBottom: 12 }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cover.src} alt="" />
                    </div>
                  )}
                  <div className="os-flex" style={{ marginBottom: 8 }}>
                    <strong style={{ fontSize: 16 }}>{r.name}</strong>
                    <span className="os-muted os-small">v{r.version}</span>
                    <span className="os-right">
                      <Chip tone={r.stage === "approved" ? "accent" : undefined}>
                        {STAGE_LABEL[r.stage]}
                      </Chip>
                    </span>
                  </div>
                  <div className="os-small os-muted" style={{ display: "grid", gap: 3 }}>
                    <span>
                      Cost/unit {ZAR(cost.costPerUnit, 2)} · sells {ZAR(r.sellingPrice)}
                    </span>
                    <span>
                      Margin{" "}
                      <strong
                        className={cost.margin >= 0.6 ? "os-pos" : undefined}
                        style={{ color: cost.margin < 0.4 ? "var(--os-danger)" : undefined }}
                      >
                        {pct(cost.margin)}
                      </strong>{" "}
                      · {ZAR(cost.costPerLitre, 2)}/L
                    </span>
                    <span>
                      Stock supports {batchesAvailable(vault, r)} batch
                      {batchesAvailable(vault, r) === 1 ? "" : "es"}
                      {fb ? ` · ★ ${fb.overall.toFixed(1)} (${fb.count})` : ""}
                    </span>
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      ) : (
        <Empty
          title="No recipes yet"
          body="Start with an idea — cost it from inventory, trial it, then approve to lock it."
          action={
            <button className="os-btn" onClick={addRecipe}>
              <Plus size={15} /> New recipe
            </button>
          }
        />
      )}

      {open && (
        <RecipeEditor
          recipe={open}
          onClose={() => setOpenId(null)}
          onSurvey={() => setSurveyFor(open.id)}
          onNavigate={onNavigate}
        />
      )}
      {surveyFor && (
        <SurveyForm recipeId={surveyFor} onClose={() => setSurveyFor(null)} />
      )}
    </div>
  );
}

function RecipeEditor({
  recipe,
  onClose,
  onSurvey,
  onNavigate,
}: {
  recipe: Recipe;
  onClose: () => void;
  onSurvey: () => void;
  onNavigate: ModuleProps["onNavigate"];
}) {
  const { vault, update } = useVault();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoKind, setPhotoKind] = useState<"process" | "finished" | "packaging">(
    "finished"
  );
  const [trialOpen, setTrialOpen] = useState(false);
  const [trialBatches, setTrialBatches] = useState(1);
  const [trialNote, setTrialNote] = useState("");
  if (!vault) return null;

  const locked = !!recipe.lockedAt;
  const cost = recipeCost(vault, recipe);
  const feedback = recipeFeedback(vault, recipe.id);
  const versions = vault.recipes
    .filter((r) => r.name === recipe.name)
    .sort((a, b) => b.version - a.version);

  const set = (fn: (r: Recipe) => void) =>
    update((d) => {
      const r = d.recipes.find((x) => x.id === recipe.id);
      if (r) fn(r);
    });

  function approve() {
    set((r) => {
      r.stage = "approved";
      r.lockedAt = today();
    });
  }

  function newVersion() {
    let id: string | null = null;
    update((d) => {
      id = forkRecipe(d, recipe.id);
    });
    if (id) setTimeout(() => onClose(), 0);
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const srcs = await Promise.all([...files].map((f) => shrink(f)));
    set((r) => {
      srcs.forEach((src) =>
        r.photos.push({ id: uid("ph_"), src, kind: photoKind })
      );
    });
  }

  function exportPDF() {
    /* The browser's own print-to-PDF keeps this dependency-free and gives a
       proper page size dialogue. */
    window.print();
  }

  const ingredients = vault.inventory.filter(
    (i) => i.category !== "finished" && !i.archived
  );

  return (
    <Modal title={`${recipe.name} · v${recipe.version}`} onClose={onClose}>
      <div className="os-stack">
        {locked && (
          <div className="os-locked-note">
            <Lock size={15} />
            Approved on {dateLabel(recipe.lockedAt!)} — read-only. Create a new
            version to make changes.
          </div>
        )}

        <div className="os-row os-no-print">
          <Field label="Name">
            <input
              className="os-input"
              value={recipe.name}
              disabled={locked}
              onChange={(e) => set((r) => void (r.name = e.target.value))}
            />
          </Field>
          <Field label="Stage">
            <select
              className="os-select"
              value={recipe.stage}
              disabled={locked}
              onChange={(e) =>
                set((r) => void (r.stage = e.target.value as RecipeStage))
              }
            >
              {STAGES.filter((s) => s !== "approved" || locked).map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="os-row">
          <Field label="Yield (litres)">
            <input
              className="os-input"
              type="number"
              value={recipe.yieldLitres}
              disabled={locked}
              onChange={(e) =>
                set((r) => void (r.yieldLitres = Number(e.target.value)))
              }
            />
          </Field>
          <Field label="Units per batch">
            <input
              className="os-input"
              type="number"
              value={recipe.outputUnits}
              disabled={locked}
              onChange={(e) =>
                set((r) => void (r.outputUnits = Number(e.target.value)))
              }
            />
          </Field>
          <Field label="Selling price">
            <input
              className="os-input"
              type="number"
              value={recipe.sellingPrice}
              disabled={locked}
              onChange={(e) =>
                set((r) => void (r.sellingPrice = Number(e.target.value)))
              }
            />
          </Field>
        </div>

        <div className="os-row">
          <Field label="Production (min)">
            <input
              className="os-input"
              type="number"
              value={recipe.productionMinutes}
              disabled={locked}
              onChange={(e) =>
                set((r) => void (r.productionMinutes = Number(e.target.value)))
              }
            />
          </Field>
          <Field label="Blast freeze (min)">
            <input
              className="os-input"
              type="number"
              value={recipe.blastFreezeMinutes}
              disabled={locked}
              onChange={(e) =>
                set((r) => void (r.blastFreezeMinutes = Number(e.target.value)))
              }
            />
          </Field>
          <Field label="Produces">
            <select
              className="os-select"
              value={recipe.outputItemId ?? ""}
              disabled={locked}
              onChange={(e) =>
                set((r) => void (r.outputItemId = e.target.value || undefined))
              }
            >
              <option value="">— finished stock item —</option>
              {vault.inventory
                .filter((i) => i.category === "finished")
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
            </select>
          </Field>
        </div>

        <SectionTitle>Ingredients</SectionTitle>
        {recipe.ingredients.map((line, idx) => {
          const item = line.itemId
            ? vault.inventory.find((i) => i.id === line.itemId)
            : undefined;
          const free = !line.itemId;
          const lineCost = free
            ? (line.cost ?? 0)
            : (item?.unitCost ?? 0) * line.qty;
          return (
            <Card key={idx} style={{ marginBottom: 10 }}>
              <div className="os-row">
                <Field label="Ingredient">
                  <select
                    className="os-select"
                    value={free ? "__free" : line.itemId}
                    disabled={locked}
                    onChange={(e) =>
                      set((r) => {
                        const l = r.ingredients[idx];
                        if (e.target.value === "__free") {
                          l.itemId = undefined;
                          l.name = l.name ?? "";
                          l.unit = l.unit ?? "g";
                          l.cost = l.cost ?? 0;
                        } else {
                          l.itemId = e.target.value;
                          l.name = undefined;
                          l.unit = undefined;
                          l.cost = undefined;
                        }
                      })
                    }
                  >
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                    <option value="__free">— type it in myself —</option>
                  </select>
                </Field>

                {free && (
                  <Field label="Name">
                    <input
                      className="os-input"
                      value={line.name ?? ""}
                      placeholder="Mint leaves"
                      disabled={locked}
                      onChange={(e) =>
                        set((r) => void (r.ingredients[idx].name = e.target.value))
                      }
                    />
                  </Field>
                )}

                <Field label={`Quantity${item ? ` (${item.unit})` : ""}`}>
                  <input
                    className="os-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={line.qty}
                    disabled={locked}
                    onChange={(e) =>
                      set((r) => void (r.ingredients[idx].qty = Number(e.target.value)))
                    }
                  />
                </Field>

                {free && (
                  <Field label="Unit">
                    <select
                      className="os-select"
                      value={line.unit ?? "g"}
                      disabled={locked}
                      onChange={(e) =>
                        set((r) => void (r.ingredients[idx].unit = e.target.value as Unit))
                      }
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {free ? (
                  <Field label="Cost of this amount (R)">
                    <input
                      className="os-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={line.cost ?? 0}
                      disabled={locked}
                      onChange={(e) =>
                        set((r) => void (r.ingredients[idx].cost = Number(e.target.value)))
                      }
                    />
                  </Field>
                ) : (
                  <Field label={`Current cost per ${item?.unit ?? "unit"} (R)`}>
                    <input
                      className="os-input"
                      type="number"
                      step="0.01"
                      min="0"
                      value={item?.unitCost ?? 0}
                      disabled={locked || !item}
                      onChange={(e) =>
                        update((d) => {
                          const t = d.inventory.find((i) => i.id === line.itemId);
                          if (t) t.unitCost = Number(e.target.value);
                        })
                      }
                    />
                  </Field>
                )}
              </div>
              <div className="os-flex os-small os-muted">
                <span>
                  Costs <strong>{ZAR(lineCost, 2)}</strong> per batch
                  {!free && item && (
                    <> · changing the cost updates it everywhere this item is used</>
                  )}
                  {free && <> · not tracked in stock</>}
                </span>
                {!locked && (
                  <button
                    className="os-btn os-btn--ghost os-btn--sm os-right"
                    onClick={() => set((r) => void r.ingredients.splice(idx, 1))}
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                )}
              </div>
            </Card>
          );
        })}
        {!locked && (
          <div className="os-flex">
            <button
              className="os-btn os-btn--ghost os-btn--sm"
              onClick={() =>
                set((r) =>
                  r.ingredients.push({ itemId: ingredients[0]?.id, qty: 1 })
                )
              }
              disabled={!ingredients.length}
            >
              <Plus size={13} /> From inventory
            </button>
            <button
              className="os-btn os-btn--ghost os-btn--sm"
              onClick={() =>
                set((r) =>
                  r.ingredients.push({ qty: 1, name: "", unit: "g", cost: 0 })
                )
              }
            >
              <Plus size={13} /> Other ingredient
            </button>
          </div>
        )}

        <Card>
          <div className="os-grid os-grid--3">
            <div>
              <div className="os-stat-label">Cost per batch</div>
              <div className="os-stat-value" style={{ fontSize: 21 }}>
                {ZAR(cost.totalCost, 2)}
              </div>
              <div className="os-stat-sub">
                incl. {vault.settings.wastePct}% waste ({ZAR(cost.wasteCost, 2)})
              </div>
            </div>
            <div>
              <div className="os-stat-label">Per litre / per unit</div>
              <div className="os-stat-value" style={{ fontSize: 21 }}>
                {ZAR(cost.costPerLitre, 2)}
              </div>
              <div className="os-stat-sub">{ZAR(cost.costPerUnit, 2)} per unit</div>
            </div>
            <div>
              <div className="os-stat-label">Gross margin</div>
              <div
                className="os-stat-value"
                style={{
                  fontSize: 21,
                  color:
                    cost.margin >= 0.6
                      ? "var(--os-accent)"
                      : cost.margin < 0.4
                        ? "var(--os-danger)"
                        : undefined,
                }}
              >
                {pct(cost.margin)}
              </div>
              <div className="os-stat-sub">{ZAR(cost.grossProfit, 2)} per unit</div>
            </div>
          </div>
          {cost.missingPrice && (
            <p className="os-small" style={{ color: "var(--os-danger)", marginTop: 10 }}>
              Some ingredients have no purchase price yet — record a purchase to
              cost this accurately.
            </p>
          )}
        </Card>

        <SectionTitle>Quality control</SectionTitle>
        <div className="os-row">
          {(
            [
              ["appearance", "Appearance"],
              ["texture", "Texture"],
              ["colour", "Colour"],
              ["melt", "Melt"],
              ["overrun", "Overrun"],
            ] as const
          ).map(([k, label]) => (
            <Field key={k} label={label}>
              <input
                className="os-input"
                value={recipe.quality[k]}
                disabled={locked}
                onChange={(e) => set((r) => void (r.quality[k] = e.target.value))}
              />
            </Field>
          ))}
        </div>
        {(
          [
            ["taste", "Taste notes"],
            ["customerFeedback", "Customer feedback"],
            ["lessons", "Lessons learnt"],
          ] as const
        ).map(([k, label]) => (
          <Field key={k} label={label}>
            <textarea
              className="os-textarea"
              value={recipe.quality[k]}
              disabled={locked}
              onChange={(e) => set((r) => void (r.quality[k] = e.target.value))}
            />
          </Field>
        ))}

        <SectionTitle>Photographs</SectionTitle>
        {!locked && (
          <div className="os-flex os-no-print">
            <select
              className="os-select"
              style={{ maxWidth: 180 }}
              value={photoKind}
              onChange={(e) =>
                setPhotoKind(e.target.value as "process" | "finished" | "packaging")
              }
            >
              <option value="finished">Finished product</option>
              <option value="process">Process</option>
              <option value="packaging">Packaging</option>
            </select>
            <button
              className="os-btn os-btn--ghost os-btn--sm"
              onClick={() => fileRef.current?.click()}
            >
              <Plus size={13} /> Add photos
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => addPhotos(e.target.files)}
            />
          </div>
        )}
        {recipe.photos.length ? (
          <div className="os-photos">
            {recipe.photos.map((p) => (
              <div className="os-photo" key={p.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.kind} />
                <span>{p.kind}</span>
                {!locked && (
                  <button
                    onClick={() =>
                      set((r) => void (r.photos = r.photos.filter((x) => x.id !== p.id)))
                    }
                    aria-label="Remove photo"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="os-small os-muted">No photographs yet.</p>
        )}

        <SectionTitle>Customer insight</SectionTitle>
        {feedback ? (
          <Card>
            <div className="os-grid os-grid--4">
              {(
                [
                  ["Overall", feedback.overall],
                  ["Taste", feedback.taste],
                  ["Texture", feedback.texture],
                  ["Packaging", feedback.packaging],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <div className="os-stat-label">{label}</div>
                  <div className="os-stat-value" style={{ fontSize: 19 }}>
                    {value.toFixed(1)}
                  </div>
                </div>
              ))}
            </div>
            <p className="os-small os-muted" style={{ marginTop: 10, marginBottom: 0 }}>
              From {feedback.count} response{feedback.count === 1 ? "" : "s"} ·
              purchase likelihood {feedback.likelihood.toFixed(1)}/5
            </p>
          </Card>
        ) : (
          <p className="os-small os-muted">
            No tasting feedback captured for this recipe yet.
          </p>
        )}
        <div className="os-flex os-no-print">
          <button className="os-btn os-btn--ghost os-btn--sm" onClick={onSurvey}>
            <Star size={13} /> Record tasting feedback
          </button>
          <button
            className="os-btn os-btn--ghost os-btn--sm"
            disabled={!recipe.ingredients.length}
            onClick={() => setTrialOpen(true)}
          >
            <Beaker size={13} /> Log a trial batch
          </button>
        </div>

        <Field label="Notes">
          <textarea
            className="os-textarea"
            value={recipe.notes}
            disabled={locked}
            onChange={(e) => set((r) => void (r.notes = e.target.value))}
          />
        </Field>

        {versions.length > 1 && (
          <p className="os-small os-muted">
            Versions: {versions.map((v) => `v${v.version}`).join(", ")}
          </p>
        )}

        <div className="os-flex os-no-print" style={{ marginTop: 6 }}>
          {!locked && recipe.stage !== "archived" && (
            <button className="os-btn os-btn--accent" onClick={approve}>
              <Lock size={15} /> Approve &amp; lock
            </button>
          )}
          {locked && (
            <button className="os-btn" onClick={newVersion}>
              <GitBranch size={15} /> New version
            </button>
          )}
          <button className="os-btn os-btn--ghost" onClick={exportPDF}>
            <FileDown size={15} /> Export PDF
          </button>
          <button
            className="os-btn os-btn--danger os-btn--sm os-right"
            onClick={() => {
              update((d) => void (d.recipes = d.recipes.filter((r) => r.id !== recipe.id)));
              onClose();
            }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {trialOpen && (
        <Modal
          title="Log a trial batch"
          onClose={() => setTrialOpen(false)}
          footer={
            <>
              <button
                className="os-btn os-btn--ghost"
                onClick={() => setTrialOpen(false)}
              >
                Cancel
              </button>
              <button
                className="os-btn"
                onClick={() => {
                  update((d) => recordTrial(d, recipe.id, trialBatches, trialNote));
                  setTrialOpen(false);
                  setTrialNote("");
                }}
              >
                Record trial
              </button>
            </>
          }
        >
          <p className="os-small os-muted">
            A trial takes the ingredients out of stock without producing sellable
            units — the cost lands in R&amp;D rather than in finished goods.
          </p>
          <div className="os-row">
            <Field label="How many batches">
              <input
                className="os-input"
                type="number"
                min={1}
                value={trialBatches}
                onChange={(e) => setTrialBatches(Number(e.target.value))}
              />
            </Field>
            <Field label="Note">
              <input
                className="os-input"
                value={trialNote}
                placeholder="What you were testing"
                onChange={(e) => setTrialNote(e.target.value)}
              />
            </Field>
          </div>
          <Card>
            <div className="os-small">
              <strong>Comes out of stock:</strong>
              <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                {recipe.ingredients.map((line, i) => {
                  const item = vault.inventory.find((x) => x.id === line.itemId);
                  if (!item) return null;
                  const need = line.qty * trialBatches;
                  return (
                    <div key={i} className="os-flex">
                      <span>{item.name}</span>
                      <span
                        className="os-right"
                        style={{
                          color: need > item.stock ? "var(--os-danger)" : undefined,
                        }}
                      >
                        {need} {item.unit} of {Number(item.stock.toFixed(2))}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="os-muted" style={{ marginTop: 10, marginBottom: 0 }}>
                Ingredient cost of this trial:{" "}
                <strong>{ZAR(cost.ingredientCost * trialBatches, 2)}</strong>
              </p>
            </div>
          </Card>
        </Modal>
      )}
    </Modal>
  );
}

function SurveyForm({
  recipeId,
  onClose,
}: {
  recipeId: string;
  onClose: () => void;
}) {
  const { update } = useVault();
  const [s, setS] = useState<Omit<Survey, "id">>({
    date: today(),
    recipeId,
    respondent: "",
    demographic: "",
    ratingOverall: 4,
    ratingTaste: 4,
    ratingTexture: 4,
    ratingPackaging: 4,
    pricePerception: "fair",
    purchaseLikelihood: 4,
    favouriteFlavour: "",
    comments: "",
  });

  const rating = (
    label: string,
    key: "ratingOverall" | "ratingTaste" | "ratingTexture" | "ratingPackaging" | "purchaseLikelihood"
  ) => (
    <Field label={`${label} — ${s[key]}/5`}>
      <input
        className="os-input"
        type="range"
        min={1}
        max={5}
        value={s[key]}
        onChange={(e) => setS({ ...s, [key]: Number(e.target.value) })}
      />
    </Field>
  );

  return (
    <Modal
      title="Tasting feedback"
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="os-btn"
            onClick={() => {
              update((d) => d.surveys.push({ ...s, id: uid("sur_") }));
              onClose();
            }}
          >
            Save feedback
          </button>
        </>
      }
    >
      <div className="os-row">
        <Field label="Date">
          <input
            className="os-input"
            type="date"
            value={s.date}
            onChange={(e) => setS({ ...s, date: e.target.value })}
          />
        </Field>
        <Field label="Respondent (optional)">
          <input
            className="os-input"
            value={s.respondent}
            onChange={(e) => setS({ ...s, respondent: e.target.value })}
          />
        </Field>
        <Field label="Demographic (optional)">
          <input
            className="os-input"
            value={s.demographic}
            onChange={(e) => setS({ ...s, demographic: e.target.value })}
          />
        </Field>
      </div>
      <div className="os-row">
        {rating("Overall", "ratingOverall")}
        {rating("Taste", "ratingTaste")}
      </div>
      <div className="os-row">
        {rating("Texture", "ratingTexture")}
        {rating("Packaging", "ratingPackaging")}
      </div>
      <div className="os-row">
        {rating("Would buy", "purchaseLikelihood")}
        <Field label="Price perception">
          <select
            className="os-select"
            value={s.pricePerception}
            onChange={(e) =>
              setS({
                ...s,
                pricePerception: e.target.value as Survey["pricePerception"],
              })
            }
          >
            <option value="cheap">Cheap</option>
            <option value="fair">Fair</option>
            <option value="expensive">Expensive</option>
          </select>
        </Field>
      </div>
      <Field label="Favourite flavour">
        <input
          className="os-input"
          value={s.favouriteFlavour}
          onChange={(e) => setS({ ...s, favouriteFlavour: e.target.value })}
        />
      </Field>
      <Field label="Comments">
        <textarea
          className="os-textarea"
          value={s.comments}
          onChange={(e) => setS({ ...s, comments: e.target.value })}
        />
      </Field>
    </Modal>
  );
}
