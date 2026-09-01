import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Batch OS",
  description: "Operating system for Batch. Gelato.",
  /* Private tool — keep it out of search results. */
  robots: { index: false, follow: false },
  manifest: "/batch/app.webmanifest",
  /* iOS ignores the manifest's icons and looks for this one. */
  appleWebApp: {
    capable: true,
    title: "Batch OS",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/batch/assets/icon-192.png",
    apple: "/batch/assets/icon-apple-180.png",
  },
  other: {
    /* Next emits only the modern spelling. Versions of iOS before 16.4 read
       the prefixed one, and without it they open in a browser tab. */
    "apple-mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  /* Let the page reach under the notch and home indicator; the shell pads
     itself back out with the safe-area insets. */
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F2EFE7" },
    { media: "(prefers-color-scheme: dark)", color: "#171613" },
  ],
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
