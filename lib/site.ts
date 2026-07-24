/** Base path helper — keeps plain <img>/<a> URLs correct under the
 *  /batch base path used on GitHub Pages. */
export const BASE = "/batch";
export const asset = (path: string) => `${BASE}${path}`;

export const CONTACT = {
  phone: "083 589 2747",
  phoneHref: "tel:0835892747",
  email: "hello@batchgelato.com",
  place: "Cape Town, South Africa",
};

export const PACK_PDF = asset("/docs/BATCH-Investor-Information-Pack-July-2026.pdf");

/** Photographic assets are served as optimised WebP; logos stay PNG. */
export const photo = (name: string) => asset(`/assets/${name}.webp`);

export const flavours = [
  { img: "pistachio", name: "Pistachio", sub: "Sicilian pistachio" },
  { img: "salt-caramel", name: "Salt & Caramel", sub: "Sea salt caramel" },
  { img: "chocolate-hazelnut", name: "Chocolate & Hazelnut", sub: "Roasted hazelnut" },
  { img: "madagascan-vanilla", name: "Madagascan Vanilla", sub: "Whole vanilla pods" },
  { img: "milk-cookies", name: "Milk & Cookies", sub: "Cookie crumble" },
  { img: "raspberry-cheesecake", name: "Raspberry Cheesecake", sub: "Raspberry & biscuit" },
  { img: "mango-cream", name: "Mango & Cream", sub: "Alphonso mango" },
  { img: "pink-coconut", name: "Pink Coconut", sub: "Coconut & berry" },
];

/** The ask — Phase 1, R320,000 (deck order). Bar widths are relative to the
 *  largest line item (the batch freezer). */
export const askNow = [
  { label: "Cubo 2 batch freezer — the gelato machine", amount: "R170,000", w: 1 },
  { label: "Storage freezer · 500L", amount: "R11,000", w: 0.065 },
  { label: "Blender", amount: "R8,000", w: 0.047 },
  { label: "Small equipment — table, scales, pitchers", amount: "R14,000", w: 0.082 },
  { label: "Packaging design and first stock", amount: "R12,000", w: 0.071 },
  { label: "Ingredients for recipe development", amount: "R12,000", w: 0.071 },
  { label: "Ingredients for first production runs", amount: "R20,000", w: 0.118 },
  { label: "Halaal certification (MJC)", amount: "R5,000", w: 0.029 },
  { label: "Logo, labels and brand basics", amount: "R5,000", w: 0.029 },
  { label: "Display stand and freezer for markets", amount: "R38,000", w: 0.224 },
  { label: "Contingency", amount: "R25,000", w: 0.147 },
];

/** A possible second phase — R195,000 (not part of the current request). */
export const askLater = [
  { label: "Market cart — custom build, integrated freezer", amount: "R90,000", w: 1 },
  { label: "Blast freezer — enables gelato pops", amount: "R45,000", w: 0.5 },
  { label: "Ingredients and packaging at volume", amount: "R25,000", w: 0.278 },
  { label: "Contingency", amount: "R20,000", w: 0.222 },
  { label: "Marketing and launch push", amount: "R15,000", w: 0.167 },
];

export type TargetRow = {
  month: string;
  tubs: number;
  litres: number;
  revenue: string;
  repay: string;
  hi?: boolean;
};

/** Monthly sales targets — the 18-month projection, Dec 2026 – May 2028. */
export const targetsYear1: TargetRow[] = [
  { month: "Dec 2026", tubs: 320, litres: 160, revenue: "R60,800", repay: "R22,630", hi: true },
  { month: "Jan 2027", tubs: 300, litres: 150, revenue: "R57,000", repay: "R21,103" },
  { month: "Feb", tubs: 290, litres: 145, revenue: "R55,100", repay: "R20,340" },
  { month: "Mar", tubs: 270, litres: 135, revenue: "R51,300", repay: "R18,813" },
  { month: "Apr", tubs: 240, litres: 120, revenue: "R45,600", repay: "R16,523" },
  { month: "May", tubs: 195, litres: 98, revenue: "R37,050", repay: "R13,087" },
  { month: "Jun", tubs: 170, litres: 85, revenue: "R32,300", repay: "R10,631" },
  { month: "Jul", tubs: 165, litres: 83, revenue: "R31,350", repay: "R9,995" },
  { month: "Aug", tubs: 190, litres: 95, revenue: "R36,100", repay: "R12,705" },
];

export const targetsYear2: TargetRow[] = [
  { month: "Sep", tubs: 225, litres: 113, revenue: "R42,750", repay: "R15,377" },
  { month: "Oct", tubs: 275, litres: 138, revenue: "R52,250", repay: "R19,195" },
  { month: "Nov", tubs: 310, litres: 155, revenue: "R58,900", repay: "R21,867" },
  { month: "Dec 2027", tubs: 420, litres: 210, revenue: "R79,800", repay: "R29,064", hi: true },
  { month: "Jan 2028", tubs: 380, litres: 190, revenue: "R72,200", repay: "R26,011" },
  { month: "Feb", tubs: 370, litres: 185, revenue: "R70,300", repay: "R25,247" },
  { month: "Mar", tubs: 350, litres: 175, revenue: "R66,500", repay: "R23,720" },
  { month: "Apr", tubs: 310, litres: 155, revenue: "R58,900", repay: "R13,692" },
  { month: "May 2028", tubs: 250, litres: 125, revenue: "R47,500", repay: "—", hi: true },
];

/** Timeline — machine available now, launching ahead of December. */
export const timeline = [
  {
    tag: "August",
    title: "Set up",
    body: "Machine installed and commissioned. Supplier training. Recipe development begins. Brand and packaging designed.",
  },
  {
    tag: "September",
    title: "Finalise",
    body: "Flavours finalised. Packaging ordered. Halaal certification submitted. Market applications lodged.",
  },
  {
    tag: "October",
    title: "First runs",
    body: "First production runs. Direct and online sales open. Initial stockists approached.",
  },
  {
    tag: "November",
    title: "Go live",
    body: "Trial market. Uber Eats listing goes live. Stock built ahead of December.",
  },
  {
    tag: "December",
    title: "Launch",
    body: "Launch at Maynardville Garden Market. Peak season trading begins.",
    variant: "dark" as const,
  },
  {
    tag: "January onward",
    title: "Full trading",
    body: "Full trading across all channels — direct, Uber Eats, stockists, markets and events.",
    variant: "accent" as const,
  },
];

/** Risk and mitigation — each risk with a corresponding plan. */
export const risks = [
  {
    title: "Recipe development runs long",
    body: "The Italian supplier provides a consulting chef and machine training. Operating costs are low, making a slower start affordable.",
  },
  {
    title: "Consistency between batches",
    body: "Italian stabilisers control texture and shelf life. Recipes documented once finalised.",
  },
  {
    title: "Product melts in transport",
    body: "Dry ice and delivery costs built into pricing. Provision made for freezers at stockists.",
  },
  {
    title: "Sales decline in winter",
    body: "Launch into summer to establish a customer base. Stockists and events sustain winter trading.",
  },
  {
    title: "Single ingredient supplier",
    body: "Hold six to eight weeks of stock once recipes are set. Identify an alternative supplier.",
  },
  {
    title: "Equipment failure",
    body: "Purchased new with a one-year guarantee. Parts held locally. Insured.",
  },
  {
    title: "Sales fall below target",
    body: "Channels open sequentially. Repayments flex with actual profit — a slow month does not create debt.",
  },
  {
    title: "Demand insufficient to continue",
    body: "Low operating costs permit continued trading at minimal cost. If discontinued, equipment is sold.",
  },
];
