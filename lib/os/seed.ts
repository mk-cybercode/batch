/**
 * Starting vault. Seeded from the July 2026 investor information pack so the
 * app is immediately usable: the loan, the Phase 1 capital purchases, the
 * supplier, the pricing formats and the launch plan are already in place.
 */

import type { CapitalPlanItem, ExpenseCategory, Vault } from "./types";
import { uid } from "./format";

export function seedVault(): Vault {
  const supplier = { id: "sup_italy", name: "Italian supplier (via SA agent)" };
  const packSupplier = { id: "sup_pack", name: "Packaging supplier" };

  const tub500 = {
    id: "inv_tub500",
    name: "500ml tub + lid",
    category: "packaging" as const,
    unit: "unit" as const,
    unitCost: 14,
    stock: 1000,
    reorderLevel: 200,
    supplierId: packSupplier.id,
  };
  const cup175 = {
    id: "inv_cup175",
    name: "175ml cup + lid",
    category: "packaging" as const,
    unit: "unit" as const,
    unitCost: 3.5,
    stock: 0,
    reorderLevel: 200,
    supplierId: packSupplier.id,
  };
  const base = {
    id: "inv_base",
    name: "Gelato base & flavour paste",
    category: "ingredient" as const,
    unit: "L" as const,
    /* R48.11 of gelato in a 380g tub works out near R127/L of finished product. */
    unitCost: 126.6,
    stock: 40,
    reorderLevel: 15,
    supplierId: supplier.id,
  };
  const finished500 = {
    id: "inv_fin500",
    name: "Finished 500ml tub",
    category: "finished" as const,
    unit: "unit" as const,
    unitCost: 67.08,
    stock: 0,
    reorderLevel: 0,
    recipeId: "rec_house",
  };

  const recipe = {
    id: "rec_house",
    name: "House 500ml tub",
    version: 1,
    stage: "trial" as const,
    yieldLitres: 8,
    outputItemId: finished500.id,
    outputUnits: 16,
    sellingPrice: 190,
    productionMinutes: 60,
    blastFreezeMinutes: 240,
    ingredients: [
      { itemId: base.id, qty: 8 },
      { itemId: tub500.id, qty: 16 },
    ],
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
    notes:
      "Batch freezer produces roughly 8 litres of finished gelato per hour of practical output.",
    createdAt: new Date().toISOString().slice(0, 10),
  };

  const plan: [string, number, ExpenseCategory][] = [
    ["Cubo 2 batch freezer", 170000, "equipment"],
    ["Storage freezer (500L)", 11000, "equipment"],
    ["Blender", 8000, "equipment"],
    ["Small equipment", 14000, "equipment"],
    ["Packaging R&D", 5000, "packaging"],
    ["First production packaging", 7000, "packaging"],
    ["Recipe development ingredients", 12000, "ingredients"],
    ["First production ingredients", 20000, "ingredients"],
    ["Halaal certification (MJC)", 5000, "certification"],
    ["Branding", 5000, "branding"],
    ["Display stand & freezer", 38000, "equipment"],
    ["Contingency", 25000, "other"],
  ];
  const capitalPlan: CapitalPlanItem[] = plan.map(([name, amount, category]) => ({
    id: uid("cp_"),
    name,
    amount,
    category,
  }));

  return {
    version: 1,
    settings: {
      businessName: "BATCH. Gelato",
      loanCapital: 320000,
      wastePct: 8,
      theme: "system",
    },
    capitalPlan,
    suppliers: [supplier, packSupplier],
    inventory: [base, tub500, cup175, finished500],
    purchases: [],
    recipes: [recipe],
    production: [],
    sales: [],
    customers: [],
    expenses: [],
    capital: [
      {
        id: uid("cap_"),
        date: new Date().toISOString().slice(0, 10),
        kind: "loan" as const,
        amount: 320000,
        note: "Phase 1 capital loan",
      },
    ],
    equipment: [],
    surveys: [],
    plan: [
      { id: uid("pl_"), date: `${new Date().getFullYear()}-08-15`, title: "Procure and install the machine; supplier training", kind: "milestone" as const },
      { id: uid("pl_"), date: `${new Date().getFullYear()}-09-15`, title: "Develop packaging, flavours and brand; send out samples", kind: "milestone" as const },
      { id: uid("pl_"), date: `${new Date().getFullYear()}-10-15`, title: "First production runs; approach stockists", kind: "production" as const },
      { id: uid("pl_"), date: `${new Date().getFullYear()}-11-15`, title: "Trial a market; Uber Eats listing goes live", kind: "event" as const },
      { id: uid("pl_"), date: `${new Date().getFullYear()}-12-05`, title: "Launch into markets and begin selling across channels", kind: "milestone" as const },
    ],
    docs: [],
  };
}
