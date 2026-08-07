"use client";

import { useState } from "react";
import { Lock as LockIcon, ShieldCheck } from "lucide-react";
import { asset } from "@/lib/site";
import { useVault } from "./VaultProvider";

/**
 * Login gate. On a fresh device it sets the passphrase that encrypts the
 * vault; afterwards it is the only way in, since the data on disk is
 * useless without it.
 */
export default function Lock() {
  const { status, create, unlock } = useVault();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const setup = status === "setup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (setup) {
      if (pass.length < 8) return setError("Use at least 8 characters.");
      if (pass !== confirm) return setError("The two entries don't match.");
      setBusy(true);
      await create(pass);
      setBusy(false);
      return;
    }
    setBusy(true);
    const ok = await unlock(pass);
    setBusy(false);
    if (!ok) {
      setError("That passphrase doesn't open this vault.");
      setPass("");
    }
  }

  return (
    <div className="os-lock">
      <div className={`os-lock-card${error ? " os-shake" : ""}`} key={error}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/assets/batch-logo-black.png")} alt="Batch." />
        <h1>{setup ? "Set your passphrase" : "Welcome back"}</h1>
        <p>
          {setup
            ? "This encrypts everything in the app on this device. There is no reset — write it down somewhere safe."
            : "Enter your passphrase to unlock the business."}
        </p>
        <form onSubmit={submit}>
          <label className="os-field">
            <span>Passphrase</span>
            <input
              className="os-input"
              type="password"
              value={pass}
              autoFocus
              autoComplete={setup ? "new-password" : "current-password"}
              onChange={(e) => setPass(e.target.value)}
            />
          </label>
          {setup && (
            <label className="os-field">
              <span>Confirm passphrase</span>
              <input
                className="os-input"
                type="password"
                value={confirm}
                autoComplete="new-password"
                onChange={(e) => setConfirm(e.target.value)}
              />
            </label>
          )}
          {error && (
            <p className="os-small" style={{ color: "var(--os-danger)", marginTop: -4 }}>
              {error}
            </p>
          )}
          <button
            className="os-btn"
            style={{ width: "100%", marginTop: 8 }}
            disabled={busy || !pass}
          >
            {setup ? <ShieldCheck size={15} /> : <LockIcon size={15} />}
            {busy ? "Working…" : setup ? "Create vault" : "Unlock"}
          </button>
        </form>
        <p className="os-small os-muted" style={{ marginTop: 18, marginBottom: 0 }}>
          Encrypted with AES-GCM on this device. Nothing is sent anywhere.
        </p>
      </div>
    </div>
  );
}
