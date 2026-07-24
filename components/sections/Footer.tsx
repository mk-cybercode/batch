import { asset, PACK_PDF } from "@/lib/site";

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/assets/batch-logo-cream.png")} alt="Batch." />
        <span>
          Made in small batches<span className="dots"> •</span> Investor
          overview, July 2026
        </span>
        <span>
          <a href={PACK_PDF} target="_blank" rel="noopener">
            Investor information pack (PDF)
          </a>{" "}
          · Confidential — please don&rsquo;t circulate.
        </span>
      </div>
    </footer>
  );
}
