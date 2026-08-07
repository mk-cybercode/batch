"use client";

import { useEffect } from "react";
import VaultProvider, { useVault } from "@/components/os/VaultProvider";
import Lock from "@/components/os/Lock";
import Shell from "@/components/os/Shell";
import "./os.css";

function Gate() {
  const { status } = useVault();

  /* Keep the light theme applied before the vault is open. */
  useEffect(() => {
    if (!document.documentElement.dataset.osTheme) {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.dataset.osTheme = dark ? "dark" : "light";
    }
  }, []);

  if (status === "loading") {
    return (
      <div className="os-lock">
        <div className="os-lock-card" style={{ textAlign: "center" }}>
          <p className="os-muted" style={{ margin: 0 }}>
            Opening…
          </p>
        </div>
      </div>
    );
  }
  if (status === "open") return <Shell />;
  return <Lock />;
}

export default function AppPage() {
  return (
    <div className="os">
      <VaultProvider>
        <Gate />
      </VaultProvider>
    </div>
  );
}
