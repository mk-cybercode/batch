/** Base path helper — keeps plain <img>/<a> URLs correct under the
 *  /batch base path used on GitHub Pages. */
export const BASE = "/batch";
export const asset = (path: string) => `${BASE}${path}`;

export const CONTACT = {
  phone: "083 589 2747",
  phoneHref: "tel:0835892747",
  whatsappHref:
    "https://wa.me/27835892747?text=" +
    encodeURIComponent(
      "Hi! I saw the Batch. investor information pack and I'm interested in investing."
    ),
  email: "hello@batchgelato.com",
  place: "Cape Town, South Africa",
};

export const PACK_PDF = asset(
  "/docs/BATCH-Investor-Information-Pack-July-2026-r2.pdf"
);

/** Photographic assets are served as optimised WebP; logos stay PNG. */
export const photo = (name: string) => asset(`/assets/${name}.webp`);

export const flavours = [
  { img: "pistachio", name: "Pistachio", sub: "Italian flavour base" },
  { img: "salt-caramel", name: "Salt & Caramel", sub: "Italian flavour base" },
  {
    img: "chocolate-hazelnut",
    name: "Chocolate & Hazelnut",
    sub: "Italian flavour base",
  },
  {
    img: "madagascan-vanilla",
    name: "Madagascan Vanilla",
    sub: "Italian flavour base",
  },
  { img: "milk-cookies", name: "Milk & Cookies", sub: "Italian flavour base" },
  {
    img: "raspberry-cheesecake",
    name: "Raspberry Cheesecake",
    sub: "Italian flavour base",
  },
  { img: "mango-cream", name: "Mango & Cream", sub: "Italian flavour base" },
  { img: "pink-coconut", name: "Pink Coconut", sub: "Italian flavour base" },
];

/** Section 04 · The capital — R320,000. Bar widths are relative to the
 *  largest line item, the batch freezer. */
export const capital = [
  {
    label: "Cubo 2 batch freezer",
    amount: "R170,000",
    w: 1,
    note: "The gelato machine. One unit in stock with the supplier.",
  },
  {
    label: "Storage freezer (500L)",
    amount: "R11,000",
    w: 0.065,
    note: "Commercial chest freezer for finished stock.",
  },
  {
    label: "Blender",
    amount: "R8,000",
    w: 0.047,
    note: "For preparing and emulsifying the mix.",
  },
  {
    label: "Small equipment",
    amount: "R14,000",
    w: 0.082,
    note: "Table, scales, thermometer, pitchers, containers.",
  },
  {
    label: "Packaging R&D",
    amount: "R5,000",
    w: 0.029,
    note: "Artwork, sample runs and testing of tubs and labels.",
  },
  {
    label: "First production packaging",
    amount: "R7,000",
    w: 0.041,
    note: "A first import order of 500ml tubs — approximately 1,000 units.",
  },
  {
    label: "Recipe development ingredients",
    amount: "R12,000",
    w: 0.071,
    note: "Trial batches during R&D.",
  },
  {
    label: "First production ingredients",
    amount: "R20,000",
    w: 0.118,
    note: "Approximately 281 litres — roughly 560 × 500ml tubs of sellable stock.",
  },
  {
    label: "Halaal certification (MJC)",
    amount: "R5,000",
    w: 0.029,
    note: "Required for the target market.",
  },
  { label: "Branding", amount: "R5,000", w: 0.029, note: "Brand identity." },
  {
    label: "Display stand & freezer (allowance)",
    amount: "R38,000",
    w: 0.224,
    note: "A small display stand and freezer for trading at markets.",
  },
  {
    label: "Contingency",
    amount: "R25,000",
    w: 0.147,
    note: "Buffer for cost variances.",
  },
];

/** Section 12 · A possible second phase — approximately R200,000. */
export const secondPhase = [
  {
    label: "Market cart (custom build with integrated freezer)",
    amount: "R125,000",
    w: 1,
  },
  {
    label: "Blast freezer (for expanding product range — gelato sticks, cakes etc)",
    amount: "R50,000",
    w: 0.4,
  },
  { label: "Marketing push (includes gelato sampling)", amount: "R10,000", w: 0.08 },
  { label: "Ingredients and packaging at increased volume", amount: "R10,000", w: 0.08 },
  { label: "Contingency", amount: "R5,000", w: 0.04 },
];

/** Section 05 · Products and pricing. Costs include ingredients, packaging
 *  and an 8% allowance for waste. */
export const products = [
  {
    name: "500ml tub",
    price: "R190.00",
    gelato: "R48.11",
    packaging: "R14.00",
    waste: "R5.05",
    cost: "R67.08",
    costPct: 35.3,
    profit: "R122.92",
    margin: "65%",
    d: [100, 400] as [number, number],
  },
  {
    name: "3-pack (3×175ml)",
    price: "R195.00",
    gelato: "R50.52",
    packaging: "R15.00",
    waste: "R5.24",
    cost: "R70.76",
    costPct: 36.3,
    profit: "R124.24",
    margin: "64%",
    d: [200, 500] as [number, number],
  },
  {
    name: "175ml cup",
    price: "R65.00",
    gelato: "R16.84",
    packaging: "R3.50",
    waste: "R1.63",
    cost: "R21.97",
    costPct: 33.8,
    profit: "R43.03",
    margin: "66%",
    d: [300, 600] as [number, number],
  },
];

/** Section 06 · Revenue streams — profit per litre of gelato produced. */
export const profitPerLitre = [
  { label: "Event package (150 servings)", value: "~R370", w: 1, tone: "deep" },
  { label: "Direct 500ml tub", value: "R246", w: 0.665, tone: "mid" },
  { label: "Uber Eats 500ml", value: "R246", w: 0.665, tone: "mid" },
  { label: "Market 175ml cup", value: "R246", w: 0.665, tone: "mid" },
  { label: "3-pack", value: "R237", w: 0.641, tone: "caramel" },
  { label: "Stockist wholesale", value: "R116", w: 0.314, tone: "caramel-deep" },
];

/** Section 02 · Four channels, four buyers. */
export const channels = [
  {
    role: "Highest margin",
    tone: "margin",
    title: "Direct orders",
    body: "Marketed through social media and word of mouth, taken by phone, WhatsApp or Instagram, and collected — with delivery arranged on large orders. The highest-margin channel, as no commission is paid.",
  },
  {
    role: "Reach",
    tone: "volume",
    title: "Uber Eats",
    body: "Provides immediate access to a large customer base. The platform charges commission, which is built into the listed price so the amount received remains consistent.",
  },
  {
    role: "Visibility",
    tone: "volume",
    title: "Retail stockists",
    body: "Coffee shops, restaurants, takeaways and bakeries that stock BATCH. tubs in their own freezers. Lower margin but steady volume and valuable brand visibility. A small branded freezer is provided to each stockist.",
  },
  {
    role: "Brand",
    tone: "margin",
    title: "Markets and events",
    body: "Weekend markets and private functions. Markets build brand awareness; events are a higher-value service offering.",
  },
];

export type TargetRow = {
  month: string;
  tubs: number;
  revenue: string;
  repay: string;
  hi?: boolean;
  retained?: boolean;
};

/** Section 07 · Monthly sales targets — the most conservative expected
 *  volume, revenue and repayment in each month, Nov 2026 – Aug 2028. */
export const targetsYear1: TargetRow[] = [
  { month: "Nov 2026", tubs: 70, revenue: "R13,300", repay: "retained", retained: true },
  { month: "Dec 2026", tubs: 140, revenue: "R37,100", repay: "retained", retained: true },
  { month: "Jan 2027", tubs: 145, revenue: "R38,050", repay: "retained", retained: true },
  { month: "Feb 2027", tubs: 135, revenue: "R36,150", repay: "retained", retained: true },
  { month: "Mar 2027", tubs: 155, revenue: "R39,950", repay: "retained", retained: true },
  { month: "Apr 2027", tubs: 170, revenue: "R42,800", repay: "R15,456", hi: true },
  { month: "May 2027", tubs: 155, revenue: "R39,950", repay: "R14,394" },
  { month: "Jun 2027", tubs: 135, revenue: "R36,150", repay: "R13,968" },
  { month: "Jul 2027", tubs: 135, revenue: "R36,150", repay: "R13,968" },
  { month: "Aug 2027", tubs: 155, revenue: "R39,950", repay: "R15,384" },
  { month: "Sep 2027", tubs: 175, revenue: "R43,750", repay: "R15,810" },
];

export const targetsYear2: TargetRow[] = [
  { month: "Oct 2027", tubs: 210, revenue: "R50,400", repay: "R18,288" },
  { month: "Nov 2027", tubs: 245, revenue: "R67,550", repay: "R22,776" },
  { month: "Dec 2027", tubs: 310, revenue: "R79,900", repay: "R27,378", hi: true },
  { month: "Jan 2028", tubs: 285, revenue: "R75,150", repay: "R25,608" },
  { month: "Feb 2028", tubs: 265, revenue: "R60,850", repay: "R21,192" },
  { month: "Mar 2028", tubs: 250, revenue: "R58,000", repay: "R20,130" },
  { month: "Apr 2028", tubs: 225, revenue: "R53,250", repay: "R19,350" },
  { month: "May 2028", tubs: 205, revenue: "R49,450", repay: "R17,934" },
  { month: "Jun 2028", tubs: 185, revenue: "R45,650", repay: "R17,508" },
  { month: "Jul 2028", tubs: 185, revenue: "R45,650", repay: "R17,508" },
  { month: "Aug 2028", tubs: 205, revenue: "R49,450", repay: "R18,924 †", hi: true },
];

/** Section 10 · Launch plan. */
export const launchPlan = [
  {
    tag: "August",
    body: "Procure and install the machine. Supplier training. Recipe development begins.",
  },
  {
    tag: "September",
    body: "Develop packaging. Research the market. Develop flavours. Establish the brand and begin creating demand. Send out samples.",
  },
  {
    tag: "October",
    body: "First production runs, mid-to-late month. Approach stockists and understand the selling platforms — Uber Eats and direct. Identify markets and possible vendor spots, including beaches, and research the city permits required to trade as a vendor.",
  },
  {
    tag: "November",
    body: "Trial a market to test operations. Uber Eats listing goes live. Stock built ahead of December.",
  },
  {
    tag: "December",
    body: "Launch into markets and begin selling across channels. Larger markets take applications around three months ahead, so trading may begin at smaller markets first.",
    variant: "accent" as const,
  },
  {
    tag: "January on",
    body: "Full trading across all channels — direct orders, Uber Eats, stockists, markets and events.",
    variant: "dark" as const,
  },
];

/** Section 14 · Risks and mitigation. */
export const risks = [
  {
    title: "Recipe development takes longer than planned",
    body: "The supplier provides a consulting chef and machine training. Low fixed costs mean a slower start is affordable — it is better to delay than to sell an inferior product.",
  },
  {
    title: "Product consistency varies between batches",
    body: "Italian stabilisers control texture and shelf life by design. The variable is flavour development and the cost of real ingredients. Recipes are documented once settled.",
  },
  {
    title: "Product melts in transport",
    body: "Dry ice and delivery costs are built into pricing. Collection and stockist channels are favoured early. Polystyrene tubs hold temperature longer. Provision is made for freezers at stockists.",
  },
  {
    title: "Sales decline in winter",
    body: "The business launches into summer to build a base first. Stockists and events sustain trading through winter.",
  },
  {
    title: "Reliance on a single ingredient supplier",
    body: "Six to eight weeks of buffer stock is held once recipes are set, and an alternative supplier is identified.",
  },
  {
    title: "Equipment failure",
    body: "The machine is bought new with a one-year guarantee. The supplier holds parts locally, so a breakdown is a short interruption. Equipment is insured.",
  },
  {
    title: "Sales fall below target",
    body: "Channels open in sequence so each is proven before the next. Repayments flex with actual profit, so a slow month does not create debt.",
  },
  {
    title: "Demand proves insufficient",
    body: "Low operating costs allow the business to keep trading cheaply while it finds its market. If wound down, the equipment is resold to recover part of the loan.",
  },
];

/** Section 13 · A store — three products rather than one. */
export const storeProducts = [
  {
    pct: "~75%",
    w: 0.75,
    name: "Coffee",
    body: "Sells year-round and drives daily footfall.",
  },
  {
    pct: "~63%",
    w: 0.63,
    name: "Gelato",
    body: "The signature product customers come for.",
  },
  {
    pct: "~60%",
    w: 0.6,
    name: "Desserts & waffles",
    body: "Increases the average spend per visit.",
  },
];

/** Section 13 · high foot-traffic areas identified for a store. */
export const storeAreas = [
  "Sea Point",
  "Green Point",
  "Newlands",
  "Claremont",
  "Constantia",
  "Muizenberg",
  "Simon's Town",
  "Durbanville",
  "Stellenbosch",
  "Paarl",
  "George",
  "Knysna",
];
