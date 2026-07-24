# Batch. — Investor overview

Single-page investor site for **Batch. Gelato** (Cape Town, July 2026), built
with Next.js, TypeScript, Tailwind CSS and Framer Motion, using the Batch.
design system (cream / oat / caramel / pistachio / licorice, Baloo 2 + Inter).

Content follows the July 2026 (rev 1) investor deck: the R320,000 Phase 1 ask,
67% gross margin unit economics, the 18-month financial summary and monthly
sales targets (Dec 2026 – May 2028), the August→December launch timeline, the
possible R195,000 second phase, and the risk register. The full investor
information pack PDF is downloadable from the site footer.

## Develop

```bash
npm install
npm run dev     # serves at http://localhost:3000/batch
```

## Deploy

`npm run build` produces a static export in `out/`. Pushes to the deployment
branch publish it to GitHub Pages via `.github/workflows/deploy.yml`
(Settings → Pages → Source must be "GitHub Actions").
