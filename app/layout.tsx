import type { Metadata, Viewport } from "next";
import { asset } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mk-cybercode.github.io"),
  title: "Batch. — Investor information pack",
  description:
    "Batch. Gelato — investor information pack, Cape Town, July 2026. Establishing a premium gelato brand at reduced risk, before scaling.",
  icons: { icon: asset("/assets/batch-logo-black.png") },
  openGraph: {
    title: "Batch. — Investor information pack",
    description:
      "Gelato made in small batches. Batch. Gelato — investor information pack, Cape Town, July 2026.",
    images: [asset("/assets/salt-caramel.webp")],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E1E1E",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
