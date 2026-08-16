/**
 * Batch OS — domain model.
 *
 * One vault object holds every collection. Records reference each other by
 * id so a change in one module flows to the rest without duplicate entry:
 * purchases feed inventory and finance, recipes cost themselves from
 * inventory, production consumes stock and creates finished goods, and
 * sales draw down finished goods and post revenue.
 */

export type ID = string;
/** ISO date, YYYY-MM-DD. */
export type ISODate = string;

export type Unit = "g" | "kg" | "ml" | "L" | "unit";

export type InventoryCategory =
  | "ingredient"
  | "packaging"
  | "label"
  | "consumable"
  | "finished";

export interface InventoryItem {
  id: ID;
  name: string;
  category: InventoryCategory;
  unit: Unit;
  /** Cost of one `unit`, in rand. Maintained by purchases (weighted average). */
  unitCost: number;
  stock: number;
  reorderLevel: number;
  supplierId?: ID;
  notes?: string;
  /** Finished goods only — which recipe produced them. */
  recipeId?: ID;
  archived?: boolean;
}

export interface Supplier {
  id: ID;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  notes?: string;
  /** Drive links to quotes, invoices, certificates. */
  documentIds?: ID[];
}

export interface PurchaseLine {
  itemId: ID;
  /** Total quantity received, in the item's own unit — packs × packSize. */
  qty: number;
  /** How many containers were bought (bags, boxes, cases, or loose units). */
  packs?: number;
  /** How much of the item's unit is in each container, e.g. 5 for a 5kg bag. */
  packSize?: number;
  /** Total paid for this line, in rand (not per unit). */
  lineTotal: number;
}

/**
 * Stock rises only through purchases. It falls through production, sales,
 * and the movements recorded here — a recipe trial, something used or
 * spoiled, or a counted stock take. Every fall has a reason attached.
 */
export type MovementKind = "trial" | "usage" | "waste" | "count";

export interface StockAdjustment {
  id: ID;
  date: ISODate;
  itemId: ID;
  kind: MovementKind;
  /** Amount used, in the item's unit. A count carries the difference. */
  qty: number;
  from: number;
  to: number;
  reason: string;
  /** Set when a recipe trial consumed it, so R&D cost is traceable. */
  recipeId?: ID;
}

export const MOVEMENT_LABEL: Record<MovementKind, string> = {
  trial: "Trial batch",
  usage: "Used",
  waste: "Wasted / spoiled",
  count: "Stock take",
};

export interface Purchase {
  id: ID;
  date: ISODate;
  supplierId?: ID;
  reference?: string;
  lines: PurchaseLine[];
  /** Which finance bucket this purchase lands in. */
  category: ExpenseCategory;
  /** Capital purchases are funded from the loan, not from trading cash. */
  fundedFromCapital?: boolean;
  notes?: string;
}

export type RecipeStage = "idea" | "trial" | "testing" | "approved" | "archived";

/**
 * A recipe line is either linked to inventory — so its cost tracks the real
 * purchase price and production can draw it down — or typed in freely for
 * something not stocked, carrying its own name, unit and cost.
 */
export interface RecipeIngredient {
  /** Set when the line is linked to an inventory item. */
  itemId?: ID;
  /** Quantity used per batch, in the line's unit. */
  qty: number;
  /** Free-text line only. */
  name?: string;
  unit?: Unit;
  /** Free-text line only — cost of the quantity used, in rand. */
  cost?: number;
}

export interface QualityCheck {
  appearance: string;
  texture: string;
  colour: string;
  melt: string;
  /** Percentage air incorporated. */
  overrun: string;
  taste: string;
  customerFeedback: string;
  lessons: string;
}

export interface RecipePhoto {
  id: ID;
  /** Data URL, downscaled on import. */
  src: string;
  caption?: string;
  kind: "process" | "finished" | "packaging";
}

export interface Recipe {
  id: ID;
  name: string;
  version: number;
  /** Set when this version was created from an approved parent. */
  parentId?: ID;
  stage: RecipeStage;
  /** Litres of finished gelato the batch yields. */
  yieldLitres: number;
  /** Which finished-goods item a batch produces, and how many. */
  outputItemId?: ID;
  outputUnits: number;
  sellingPrice: number;
  productionMinutes: number;
  blastFreezeMinutes: number;
  ingredients: RecipeIngredient[];
  quality: QualityCheck;
  photos: RecipePhoto[];
  notes: string;
  createdAt: ISODate;
  /** Approved recipes are read-only; edits fork a new version. */
  lockedAt?: ISODate;
}

export interface ProductionBatch {
  id: ID;
  date: ISODate;
  recipeId: ID;
  /** Multiples of the recipe's batch size. */
  batches: number;
  litresProduced: number;
  unitsProduced: number;
  wasteLitres: number;
  labourMinutes: number;
  downtimeMinutes: number;
  notes?: string;
  /** Set once stock movements have been applied — prevents double-posting. */
  posted?: boolean;
}

export type SalesChannel =
  | "market"
  | "event"
  | "stockist"
  | "direct"
  | "platform"
  | "wholesale";

export interface SaleLine {
  itemId: ID;
  qty: number;
  unitPrice: number;
  /** Cost per unit captured at the time of sale. */
  unitCost: number;
}

export interface Sale {
  id: ID;
  date: ISODate;
  channel: SalesChannel;
  customerId?: ID;
  lines: SaleLine[];
  /** Commission, stall fee or delivery cost carried by this sale. */
  channelCost: number;
  paymentMethod: "cash" | "card" | "eft" | "platform";
  notes?: string;
  posted?: boolean;
}

export type CustomerType =
  | "stockist"
  | "cafe"
  | "hotel"
  | "restaurant"
  | "wholesale"
  | "private";

export interface Customer {
  id: ID;
  name: string;
  type: CustomerType;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  /** Next contact date — surfaces on the dashboard when due. */
  followUpOn?: ISODate;
}

export type ExpenseCategory =
  | "equipment"
  | "ingredients"
  | "packaging"
  | "certification"
  | "branding"
  | "marketing"
  | "electricity"
  | "transport"
  | "stallFees"
  | "staff"
  | "dryIce"
  | "cardFees"
  | "consumables"
  | "other";

export interface Expense {
  id: ID;
  date: ISODate;
  category: ExpenseCategory;
  description: string;
  amount: number;
  supplierId?: ID;
  fundedFromCapital?: boolean;
  /** Set when generated by a purchase, so the two stay in step. */
  purchaseId?: ID;
}

export interface CapitalEvent {
  id: ID;
  date: ISODate;
  kind: "loan" | "owner" | "repayment";
  amount: number;
  note?: string;
}

export interface Equipment {
  id: ID;
  name: string;
  purchaseDate: ISODate;
  purchasePrice: number;
  serial?: string;
  supplierId?: ID;
  warrantyUntil?: ISODate;
  lifespanYears?: number;
  condition: "new" | "good" | "fair" | "needs service";
  serviceIntervalMonths?: number;
  lastServicedOn?: ISODate;
  serviceLog: { date: ISODate; note: string }[];
  documentIds?: ID[];
  /** Links back to the expense so assets and cash agree. */
  expenseId?: ID;
}

export interface Survey {
  id: ID;
  date: ISODate;
  recipeId?: ID;
  respondent?: string;
  demographic?: string;
  /** 1–5. */
  ratingOverall: number;
  ratingTaste: number;
  ratingTexture: number;
  ratingPackaging: number;
  pricePerception: "cheap" | "fair" | "expensive";
  purchaseLikelihood: number;
  favouriteFlavour?: string;
  comments?: string;
}

export type PlanKind =
  | "task"
  | "production"
  | "event"
  | "marketing"
  | "purchase"
  | "repayment"
  | "milestone";

export interface PlanItem {
  id: ID;
  date: ISODate;
  title: string;
  kind: PlanKind;
  done?: boolean;
  notes?: string;
  /** Optional link to the record this plan item is about. */
  linkType?: "recipe" | "equipment" | "customer" | "production";
  linkId?: ID;
  /** Repeat every N weeks, for recurring production or market days. */
  repeatWeeks?: number;
}

/** Built-in keys live in DOC_LABEL; anything else is a user-made category. */
export type DocCategory = string;

export interface DocCategoryDef {
  id: ID;
  label: string;
}

export interface DocLink {
  id: ID;
  title: string;
  category: DocCategory;
  url: string;
  addedOn: ISODate;
  notes?: string;
  /** Brand assets are visible without the admin gate; the rest are not. */
  brandAsset?: boolean;
  /** Set for records pulled from the linked Drive folder. */
  driveFileId?: string;
  mimeType?: string;
  modifiedAt?: string;
  /** Flagged when a synced file is no longer in the Drive folder. */
  missingFromDrive?: boolean;
}

export interface Settings {
  businessName: string;
  /** Opening loan capital, per the investor pack. */
  loanCapital: number;
  wastePct: number;
  theme: "light" | "dark" | "system";
  /** Set once the admin passphrase has been configured. */
  adminHash?: string;
  lastBackupAt?: string;
  /** Linked Google Drive folder for business documents. */
  driveFolderUrl?: string;
  driveFolderId?: string;
  /** OAuth client ID, only needed to sync a private folder's file list. */
  driveClientId?: string;
  lastDriveSyncAt?: string;
}

/** A line of the Phase 1 capital plan, ticked off as it is actually bought. */
export interface CapitalPlanItem {
  id: ID;
  name: string;
  amount: number;
  category: ExpenseCategory;
  boughtOn?: ISODate;
  /** Set when converted into a real expense, so it can't be double-counted. */
  expenseId?: ID;
}

export interface Vault {
  version: number;
  settings: Settings;
  capitalPlan: CapitalPlanItem[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  purchases: Purchase[];
  recipes: Recipe[];
  production: ProductionBatch[];
  sales: Sale[];
  customers: Customer[];
  expenses: Expense[];
  capital: CapitalEvent[];
  equipment: Equipment[];
  surveys: Survey[];
  plan: PlanItem[];
  docs: DocLink[];
  /** Categories the user has added beyond the built-in set. */
  docCategories: DocCategoryDef[];
  adjustments: StockAdjustment[];
}

export const CHANNEL_LABEL: Record<SalesChannel, string> = {
  market: "Market",
  event: "Event",
  stockist: "Stockist",
  direct: "Direct",
  platform: "Uber Eats / Mr D",
  wholesale: "Wholesale",
};

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  equipment: "Equipment",
  ingredients: "Ingredients",
  packaging: "Packaging",
  certification: "Certification",
  branding: "Branding",
  marketing: "Marketing",
  electricity: "Electricity",
  transport: "Transport & fuel",
  stallFees: "Stall fees",
  staff: "Staff",
  dryIce: "Dry ice",
  cardFees: "Card fees",
  consumables: "Consumables",
  other: "Other",
};

export const STAGE_LABEL: Record<RecipeStage, string> = {
  idea: "Idea",
  trial: "Trial",
  testing: "Testing",
  approved: "Approved",
  archived: "Archived",
};

export const DOC_LABEL: Record<string, string> = {
  uncategorised: "Uncategorised",
  registration: "Company registration",
  tax: "Tax",
  insurance: "Insurance",
  contract: "Contracts",
  quote: "Quotes",
  invoice: "Invoices",
  receipt: "Receipts",
  manual: "Equipment manuals",
  foodSafety: "Food safety",
  minutes: "Meeting minutes",
  legal: "Legal",
  brand: "Brand assets",
};
