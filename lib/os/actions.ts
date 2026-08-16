/**
 * Cross-module writes.
 *
 * These are the only places stock and cash move. Each posts once and is
 * marked, so re-saving a record can't double-count it. All of them mutate a
 * draft vault produced by the store's `update()`.
 */

import type {
  MovementKind,
  ProductionBatch,
  Purchase,
  Sale,
  Vault,
} from "./types";
import { recipeCost } from "./calc";
import { today, uid } from "./format";

/**
 * Receiving a purchase raises stock, re-averages the unit cost so recipes
 * cost themselves correctly, and writes the matching expense.
 */
export function postPurchase(v: Vault, purchase: Purchase) {
  for (const line of purchase.lines) {
    const item = v.inventory.find((i) => i.id === line.itemId);
    if (!item || line.qty <= 0) continue;
    const existingValue = item.stock * item.unitCost;
    const newStock = item.stock + line.qty;
    item.unitCost =
      newStock > 0 ? (existingValue + line.lineTotal) / newStock : item.unitCost;
    item.stock = newStock;
    if (purchase.supplierId) item.supplierId = purchase.supplierId;
  }

  const total = purchase.lines.reduce((a, l) => a + l.lineTotal, 0);
  const existing = v.expenses.find((e) => e.purchaseId === purchase.id);
  if (existing) {
    existing.amount = total;
    existing.date = purchase.date;
    existing.category = purchase.category;
    existing.fundedFromCapital = purchase.fundedFromCapital;
    existing.supplierId = purchase.supplierId;
  } else {
    v.expenses.push({
      id: uid("exp_"),
      date: purchase.date,
      category: purchase.category,
      description:
        purchase.reference ||
        `Purchase — ${purchase.lines.length} line${purchase.lines.length === 1 ? "" : "s"}`,
      amount: total,
      supplierId: purchase.supplierId,
      fundedFromCapital: purchase.fundedFromCapital,
      purchaseId: purchase.id,
    });
  }
}

/** Reverses a purchase's stock and cost effect before it is edited or deleted. */
export function unpostPurchase(v: Vault, purchase: Purchase) {
  for (const line of purchase.lines) {
    const item = v.inventory.find((i) => i.id === line.itemId);
    if (!item || line.qty <= 0) continue;
    const remaining = item.stock - line.qty;
    const remainingValue = item.stock * item.unitCost - line.lineTotal;
    item.stock = Math.max(0, remaining);
    item.unitCost = remaining > 0 ? Math.max(0, remainingValue / remaining) : item.unitCost;
  }
  v.expenses = v.expenses.filter((e) => e.purchaseId !== purchase.id);
}

/**
 * A production run draws its ingredients out of stock and books the
 * finished units in at their true production cost.
 */
export function postProduction(v: Vault, batch: ProductionBatch) {
  if (batch.posted) return;
  const recipe = v.recipes.find((r) => r.id === batch.recipeId);
  if (!recipe) return;

  for (const line of recipe.ingredients) {
    const item = v.inventory.find((i) => i.id === line.itemId);
    if (!item) continue;
    item.stock = Math.max(0, item.stock - line.qty * batch.batches);
  }

  if (recipe.outputItemId && batch.unitsProduced > 0) {
    const out = v.inventory.find((i) => i.id === recipe.outputItemId);
    if (out) {
      const cost = recipeCost(v, recipe);
      const addedValue = cost.totalCost * batch.batches;
      const newStock = out.stock + batch.unitsProduced;
      out.unitCost =
        newStock > 0
          ? (out.stock * out.unitCost + addedValue) / newStock
          : out.unitCost;
      out.stock = newStock;
    }
  }
  batch.posted = true;
}

export function unpostProduction(v: Vault, batch: ProductionBatch) {
  if (!batch.posted) return;
  const recipe = v.recipes.find((r) => r.id === batch.recipeId);
  if (recipe) {
    for (const line of recipe.ingredients) {
      const item = v.inventory.find((i) => i.id === line.itemId);
      if (item) item.stock += line.qty * batch.batches;
    }
    if (recipe.outputItemId) {
      const out = v.inventory.find((i) => i.id === recipe.outputItemId);
      if (out) out.stock = Math.max(0, out.stock - batch.unitsProduced);
    }
  }
  batch.posted = false;
}

/** Selling draws finished goods down; revenue is derived from the lines. */
export function postSale(v: Vault, sale: Sale) {
  if (sale.posted) return;
  for (const line of sale.lines) {
    const item = v.inventory.find((i) => i.id === line.itemId);
    if (item) item.stock = Math.max(0, item.stock - line.qty);
  }
  sale.posted = true;
}

export function unpostSale(v: Vault, sale: Sale) {
  if (!sale.posted) return;
  for (const line of sale.lines) {
    const item = v.inventory.find((i) => i.id === line.itemId);
    if (item) item.stock += line.qty;
  }
  sale.posted = false;
}

/** Buying equipment lands in the register, assets and the expense ledger at once. */
export function postEquipmentPurchase(
  v: Vault,
  equipmentId: string,
  fundedFromCapital = true
) {
  const eq = v.equipment.find((e) => e.id === equipmentId);
  if (!eq) return;
  const existing = eq.expenseId
    ? v.expenses.find((e) => e.id === eq.expenseId)
    : undefined;
  if (existing) {
    existing.amount = eq.purchasePrice;
    existing.date = eq.purchaseDate;
    existing.description = eq.name;
    existing.supplierId = eq.supplierId;
    return;
  }
  const expense = {
    id: uid("exp_"),
    date: eq.purchaseDate,
    category: "equipment" as const,
    description: eq.name,
    amount: eq.purchasePrice,
    supplierId: eq.supplierId,
    fundedFromCapital,
  };
  v.expenses.push(expense);
  eq.expenseId = expense.id;
}

/** Takes stock down and records why. Used for trials, usage and waste. */
export function recordUsage(
  v: Vault,
  itemId: string,
  qty: number,
  kind: MovementKind,
  reason: string,
  recipeId?: string
) {
  const item = v.inventory.find((i) => i.id === itemId);
  if (!item || qty <= 0) return;
  const from = item.stock;
  item.stock = Math.max(0, from - qty);
  v.adjustments.push({
    id: uid("adj_"),
    date: today(),
    itemId,
    kind,
    qty,
    from,
    to: item.stock,
    reason,
    recipeId,
  });
}

/** A counted figure replaces the running one, keeping the difference on record. */
export function recordCount(
  v: Vault,
  itemId: string,
  counted: number,
  reason: string
) {
  const item = v.inventory.find((i) => i.id === itemId);
  if (!item) return;
  const from = item.stock;
  item.stock = Math.max(0, counted);
  v.adjustments.push({
    id: uid("adj_"),
    date: today(),
    itemId,
    kind: "count",
    qty: Math.abs(counted - from),
    from,
    to: item.stock,
    reason,
  });
}

/** Consumes a recipe's ingredients for an R&D trial, without creating stock. */
export function recordTrial(
  v: Vault,
  recipeId: string,
  batches: number,
  note: string
) {
  const recipe = v.recipes.find((r) => r.id === recipeId);
  if (!recipe || batches <= 0) return;
  for (const line of recipe.ingredients) {
    recordUsage(
      v,
      line.itemId,
      line.qty * batches,
      "trial",
      note || `Trial — ${recipe.name} v${recipe.version}`,
      recipeId
    );
  }
}

/** Approving a recipe freezes it; later edits fork a new version instead. */
export function forkRecipe(v: Vault, recipeId: string): string | null {
  const src = v.recipes.find((r) => r.id === recipeId);
  if (!src) return null;
  const siblings = v.recipes.filter(
    (r) => r.name === src.name || r.parentId === src.id || r.id === src.parentId
  );
  const nextVersion = Math.max(...siblings.map((r) => r.version), src.version) + 1;
  const copy = {
    ...structuredClone(src),
    id: uid("rec_"),
    version: nextVersion,
    parentId: src.id,
    stage: "trial" as const,
    lockedAt: undefined,
    createdAt: new Date().toISOString().slice(0, 10),
  };
  v.recipes.push(copy);
  return copy.id;
}
