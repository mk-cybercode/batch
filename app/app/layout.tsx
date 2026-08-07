import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Batch OS",
  description: "Operating system for Batch. Gelato.",
  /* Private tool — keep it out of search results. */
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1E1E1E",
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
