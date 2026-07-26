import type { CSSProperties } from "react";
import { Download } from "lucide-react";
import Parallax from "@/components/fx/Parallax";
import WhatsAppIcon from "@/components/fx/WhatsAppIcon";
import { asset, photo, CONTACT, PACK_PDF } from "@/lib/site";

export default function Closing() {
  return (
    <section className="closing" id="contact">
      <div className="closing-bg" aria-hidden="true">
        <Parallax src={photo("shop-location")} speed={0.12} loading="lazy" />
      </div>
      <div className="closing-scrim" aria-hidden="true"></div>
      <div className="closing-content">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mark reveal"
          src={asset("/assets/batch-logo-cream.png")}
          alt="Batch. Gelato"
        />
        <h2 className="reveal" style={{ "--d": "120ms" } as CSSProperties}>
          A low-overhead way to establish a premium gelato brand in a market
          that has repeatedly shown it will pay for quality.
        </h2>
        <div className="closing-nums reveal" style={{ "--d": "220ms" } as CSSProperties}>
          <div>
            <b>
              <span
                data-count
                data-value="320000"
                data-prefix="R"
                data-group
                data-locale="en-US"
              >
                R320,000
              </span>
            </b>
            <em>capital sought · Phase 1</em>
          </div>
          <div>
            <b>
              <span data-count data-value="65" data-suffix="%">
                65%
              </span>
            </b>
            <em>gross margin · 500ml tub</em>
          </div>
          <div>
            <b>Aug 2028</b>
            <em>loan repaid by</em>
          </div>
        </div>
        <div className="closing-actions reveal" style={{ "--d": "320ms" } as CSSProperties}>
          <a
            className="btn btn--pistachio btn--lg"
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener"
          >
            <WhatsAppIcon />
            WhatsApp us — I&rsquo;m interested
          </a>
          <div className="action-col">
            <a
              className="btn btn--outline-light btn--lg"
              href={PACK_PDF}
              target="_blank"
              rel="noopener"
            >
              <Download aria-hidden="true" />
              Investor information pack (PDF)
            </a>
            <p className="btn-note">To access more detailed information</p>
          </div>
        </div>
        <p className="fine reveal" style={{ "--d": "400ms" } as CSSProperties}>
          {CONTACT.phone} · {CONTACT.email} · {CONTACT.place}
        </p>
      </div>
    </section>
  );
}
