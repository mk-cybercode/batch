/**
 * Derived figures — the connective tissue between modules.
 *
 * Nothing here is stored: every number is computed from the source records,
 * so a purchase, a batch or a sale posted once shows up everywhere it
 * should without being re-entered. Stock levels are the one exception,
 * carried on the item and moved by posting a purchase, batch or sale.
 */

import type {
  ExpenseCategory,
  InventoryItem,
  Recipe,
  SalesChannel,
  Vault,
} from "./types";
import { CHANNEL_LABEL, MOVEMENT_LABEL } from "./types";
import { monthKey } from "./format";

/* ------------------------------------------------------------------ */
/* Recipes                                                             */
/* ------------------------------------------------------------------ */

export interface RecipeCost {
  ingredientCost: number;
  wasteCost: number;
  totalCost: number;
  costPerLitre: number;
  costPerUnit: number;
  grossProfit: number;
  margin: number;
  missingPrice: boolean;
}

/** Costs a recipe from live inventory pricing, plus the waste allowance. */
export function recipeCost(v: Vault, r: Recipe): RecipeCost {
  let ingredientCost = 0;
  let missingPrice = false;
  for (const line of r.ingredients) {
    if (!line.itemId) {
      /* Typed-in ingredient — the cost is carried on the line itself. */
      if (!line.cost) missingPrice = true;
      ingredientCost += line.cost ?? 0;
      continue;
    }
    const item = v.inventory.find((i) => i.id === line.itemId);
    if (!item) {
      missingPrice = true;
      continue;
    }
    if (!item.unitCost) missingPrice = true;
    ingredientCost += item.unitCost * line.qty;
  }
  const wasteCost = ingredientCost * (v.settings.wastePct / 100);
  const totalCost = ingredientCost + wasteCost;
  const costPerLitre = r.yieldLitres > 0 ? totalCost / r.yieldLitres : 0;
  const costPerUnit = r.outputUnits > 0 ? totalCost / r.outputUnits : 0;
  const grossProfit = r.sellingPrice - costPerUnit;
  const margin = r.sellingPrice > 0 ? grossProfit / r.sellingPrice : 0;
  return {
    ingredientCost,
    wasteCost,
    totalCost,
    costPerLitre,
    costPerUnit,
    grossProfit,
    margin,
    missingPrice,
  };
}

/** Survey scores attached to a recipe, so R&D sees real feedback. */
export function recipeFeedback(v: Vault, recipeId: string) {
  const rows = v.surveys.filter((s) => s.recipeId === recipeId);
  if (!rows.length) return null;
  const avg = (sel: (s: (typeof rows)[number]) => number) =>
    rows.reduce((a, s) => a + sel(s), 0) / rows.length;
  return {
    count: rows.length,
    overall: avg((s) => s.ratingOverall),
    taste: avg((s) => s.ratingTaste),
    texture: avg((s) => s.ratingTexture),
    packaging: avg((s) => s.ratingPackaging),
    likelihood: avg((s) => s.purchaseLikelihood),
  };
}

/* ------------------------------------------------------------------ */
/* Finance                                                             */
/* ------------------------------------------------------------------ */

export interface Financials {
  capitalIn: number;
  ownerIn: number;
  repaid: number;
  loanOutstanding: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  operatingCosts: number;
  netProfit: number;
  capitalSpend: number;
  tradingSpend: number;
  cashAvailable: number;
  inventoryValue: number;
  assetValue: number;
  totalAssets: number;
}

/** Optionally scoped to a month key (YYYY-MM) for period views. */
export function financials(v: Vault, month?: string): Financials {
  const inPeriod = (d: string) => (month ? monthKey(d) === month : true);

  const capitalIn = v.capital
    .filter((c) => c.kind === "loan" && inPeriod(c.date))
    .reduce((a, c) => a + c.amount, 0);
  const ownerIn = v.capital
    .filter((c) => c.kind === "owner" && inPeriod(c.date))
    .reduce((a, c) => a + c.amount, 0);
  const repaid = v.capital
    .filter((c) => c.kind === "repayment" && inPeriod(c.date))
    .reduce((a, c) => a + c.amount, 0);

  let revenue = 0;
  let cogs = 0;
  let channelCosts = 0;
  for (const s of v.sales) {
    if (!inPeriod(s.date)) continue;
    for (const l of s.lines) {
      revenue += l.qty * l.unitPrice;
      cogs += l.qty * l.unitCost;
    }
    channelCosts += s.channelCost;
  }
  const grossProfit = revenue - cogs;

  const capitalSpend = v.expenses
    .filter((e) => e.fundedFromCapital && inPeriod(e.date))
    .reduce((a, e) => a + e.amount, 0);
  const tradingSpend = v.expenses
    .filter((e) => !e.fundedFromCapital && inPeriod(e.date))
    .reduce((a, e) => a + e.amount, 0);

  const operatingCosts = tradingSpend + channelCosts;
  const netProfit = grossProfit - operatingCosts;

  const inventoryValue = v.inventory
    .filter((i) => !i.archived)
    .reduce((a, i) => a + i.stock * i.unitCost, 0);
  const assetValue = v.equipment.reduce((a, e) => a + e.purchasePrice, 0);

  /* Cash is a running position, so it always spans all time. */
  const allCapital = v.capital.reduce(
    (a, c) => a + (c.kind === "repayment" ? -c.amount : c.amount),
    0
  );
  const allSpend = v.expenses.reduce((a, e) => a + e.amount, 0);
  const allRevenue = v.sales.reduce(
    (a, s) =>
      a + s.lines.reduce((b, l) => b + l.qty * l.unitPrice, 0) - s.channelCost,
    0
  );
  const cashAvailable = allCapital + allRevenue - allSpend;

  return {
    capitalIn,
    ownerIn,
    repaid,
    loanOutstanding: Math.max(
      0,
      v.settings.loanCapital -
        v.capital
          .filter((c) => c.kind === "repayment")
          .reduce((a, c) => a + c.amount, 0)
    ),
    revenue,
    cogs,
    grossProfit,
    grossMargin: revenue > 0 ? grossProfit / revenue : 0,
    operatingCosts,
    netProfit,
    capitalSpend,
    tradingSpend,
    cashAvailable,
    inventoryValue,
    assetValue,
    totalAssets: cashAvailable + inventoryValue + assetValue,
  };
}

export function expensesByCategory(v: Vault, month?: string) {
  const out = new Map<ExpenseCategory, number>();
  for (const e of v.expenses) {
    if (month && monthKey(e.date) !== month) continue;
    out.set(e.category, (out.get(e.category) ?? 0) + e.amount);
  }
  return [...out.entries()].sort((a, b) => b[1] - a[1]);
}

/** Capital still unspent — drives the purchase planner. */
export function capitalRemaining(v: Vault): number {
  const drawn = v.expenses
    .filter((e) => e.fundedFromCapital)
    .reduce((a, e) => a + e.amount, 0);
  return v.settings.loanCapital - drawn;
}

/* ------------------------------------------------------------------ */
/* Sales                                                               */
/* ------------------------------------------------------------------ */

export function saleTotals(v: Vault, saleId: string) {
  const s = v.sales.find((x) => x.id === saleId);
  if (!s) return { revenue: 0, cost: 0, gross: 0, net: 0 };
  const revenue = s.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
  const cost = s.lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
  return {
    revenue,
    cost,
    gross: revenue - cost,
    net: revenue - cost - s.channelCost,
  };
}

export function salesByChannel(v: Vault, month?: string) {
  const out = new Map<SalesChannel, { revenue: number; profit: number }>();
  for (const s of v.sales) {
    if (month && monthKey(s.date) !== month) continue;
    const revenue = s.lines.reduce((a, l) => a + l.qty * l.unitPrice, 0);
    const cost = s.lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
    const prev = out.get(s.channel) ?? { revenue: 0, profit: 0 };
    out.set(s.channel, {
      revenue: prev.revenue + revenue,
      profit: prev.profit + revenue - cost - s.channelCost,
    });
  }
  return [...out.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
}

export function bestSellers(v: Vault, limit = 5) {
  const out = new Map<string, { qty: number; revenue: number }>();
  for (const s of v.sales) {
    for (const l of s.lines) {
      const prev = out.get(l.itemId) ?? { qty: 0, revenue: 0 };
      out.set(l.itemId, {
        qty: prev.qty + l.qty,
        revenue: prev.revenue + l.qty * l.unitPrice,
      });
    }
  }
  return [...out.entries()]
    .map(([itemId, t]) => ({
      itemId,
      name: v.inventory.find((i) => i.id === itemId)?.name ?? "—",
      ...t,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit);
}

export function monthlySeries(v: Vault, months = 6) {
  const keys: string[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(d.toISOString().slice(0, 7));
  }
  return keys.map((k) => {
    const f = financials(v, k);
    return { key: k, revenue: f.revenue, profit: f.netProfit };
  });
}

export function customerTotals(v: Vault, customerId: string) {
  const rows = v.sales.filter((s) => s.customerId === customerId);
  const revenue = rows.reduce(
    (a, s) => a + s.lines.reduce((b, l) => b + l.qty * l.unitPrice, 0),
    0
  );
  return {
    orders: rows.length,
    revenue,
    average: rows.length ? revenue / rows.length : 0,
    lastOrder: rows.map((r) => r.date).sort().at(-1) ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Inventory                                                           */
/* ------------------------------------------------------------------ */

export function lowStock(v: Vault): InventoryItem[] {
  return v.inventory.filter(
    (i) => !i.archived && i.reorderLevel > 0 && i.stock <= i.reorderLevel
  );
}

export interface Movement {
  date: string;
  label: string;
  detail: string;
  delta: number;
  balance: number;
  /** True for the derived opening row, which is not a real movement. */
  opening?: boolean;
}

/** Stock accounted for by recorded events — what the item should read. */
export function netMovements(v: Vault, itemId: string): number {
  return itemHistory(v, itemId)
    .filter((m) => !m.opening)
    .reduce((a, m) => a + m.delta, 0);
}

/**
 * Every event that touched an item's stock, oldest first, with a running
 * balance. Anything the running total can't account for is shown as an
 * opening balance rather than left to look like stock appearing by itself.
 */
export function itemHistory(v: Vault, itemId: string): Movement[] {
  const item = v.inventory.find((i) => i.id === itemId);
  if (!item) return [];
  const rows: Omit<Movement, "balance">[] = [];

  for (const p of v.purchases) {
    for (const l of p.lines) {
      if (l.itemId !== itemId) continue;
      const packs = l.packs ?? l.qty;
      const size = l.packSize ?? 1;
      rows.push({
        date: p.date,
        label: "Purchase",
        detail:
          l.packs && l.packSize && l.packSize !== 1
            ? `${packs} × ${size} ${item.unit}${p.reference ? ` · ${p.reference}` : ""}`
            : p.reference || "received",
        delta: l.qty,
      });
    }
  }

  for (const b of v.production) {
    const recipe = v.recipes.find((r) => r.id === b.recipeId);
    if (!recipe || !b.posted) continue;
    const line = recipe.ingredients.find((x) => x.itemId === itemId);
    if (line) {
      rows.push({
        date: b.date,
        label: "Production",
        detail: `${b.batches} batch${b.batches === 1 ? "" : "es"} of ${recipe.name}`,
        delta: -line.qty * b.batches,
      });
    }
    if (recipe.outputItemId === itemId) {
      rows.push({
        date: b.date,
        label: "Produced",
        detail: `${recipe.name} v${recipe.version}`,
        delta: b.unitsProduced,
      });
    }
  }

  for (const s of v.sales) {
    if (!s.posted) continue;
    for (const l of s.lines) {
      if (l.itemId !== itemId) continue;
      rows.push({
        date: s.date,
        label: "Sale",
        detail: CHANNEL_LABEL[s.channel],
        delta: -l.qty,
      });
    }
  }

  for (const a of v.adjustments) {
    if (a.itemId !== itemId) continue;
    rows.push({
      date: a.date,
      label: MOVEMENT_LABEL[a.kind],
      detail: a.reason,
      delta: a.to - a.from,
    });
  }

  rows.sort((x, y) => x.date.localeCompare(y.date));
  const net = rows.reduce((a, r) => a + r.delta, 0);
  const opening = item.stock - net;

  const out: Movement[] = [];
  let balance = 0;
  if (Math.abs(opening) > 0.0001) {
    balance = opening;
    out.push({
      date: "",
      label: "Opening balance",
      detail: "Not from a purchase — starter data or an old edit",
      delta: opening,
      balance,
      opening: true,
    });
  }
  for (const r of rows) {
    balance += r.delta;
    out.push({ ...r, balance });
  }
  return out;
}

/** How many more batches the current ingredient stock supports. */
export function batchesAvailable(v: Vault, r: Recipe): number {
  if (!r.ingredients.length) return 0;
  let min = Infinity;
  for (const line of r.ingredients) {
    /* Typed-in ingredients aren't stocked, so they don't limit a batch. */
    if (!line.itemId) continue;
    const item = v.inventory.find((i) => i.id === line.itemId);
    if (!item || line.qty <= 0) continue;
    min = Math.min(min, Math.floor(item.stock / line.qty));
  }
  return Number.isFinite(min) ? Math.max(0, min) : 0;
}
