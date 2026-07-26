import { asset, PACK_PDF } from "@/lib/site";

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/assets/batch-logo-cream.png")} alt="Batch." />
        <span>
          Gelato made in small batches<span className="dots"> •</span> Investor
          information pack, July 2026
        </span>
        <span>
          <a href={PACK_PDF} target="_blank" rel="noopener">
            Investor information pack (PDF)
          </a>{" "}
          · Cape Town · Prepared by Muhammed Kolabhai
        </span>
      </div>
    </footer>
  );
}
