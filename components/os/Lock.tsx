"use client";

import { useRef, useState } from "react";
import { Lock as LockIcon, ShieldCheck, Upload } from "lucide-react";
import { asset } from "@/lib/site";
import { useVault } from "./VaultProvider";

/**
 * Login gate. On a fresh device it either sets a new passphrase or opens a
 * backup file — the second path is how a phone picks up what was entered on
 * a laptop, since each device stores its own encrypted copy.
 */
export default function Lock() {
  const { status, create, unlock, restoreFromFile } = useVault();
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<"new" | "restore">("new");
  const [backup, setBackup] = useState<{ name: string; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const setup = status === "setup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (setup && mode === "restore") {
      if (!backup) return setError("Choose your backup file first.");
      setBusy(true);
      try {
        await restoreFromFile(backup.text, pass);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open that backup.");
        setPass("");
      } finally {
        setBusy(false);
      }
      return;
    }

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

  const restoring = setup && mode === "restore";

  return (
    <div className="os-lock">
      <div className={`os-lock-card${error ? " os-shake" : ""}`} key={error}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={asset("/assets/batch-logo-black.png")} alt="Batch." />
        <h1>
          {setup
            ? restoring
              ? "Open a backup"
              : "Set your passphrase"
            : "Welcome back"}
        </h1>
        <p>
          {setup
            ? restoring
              ? "Choose the backup file exported from your other device, then enter the passphrase you use there."
              : "This encrypts everything in the app on this device. There is no reset — write it down somewhere safe. Already using Batch on another device? Type that same passphrase here, then sign in under Settings → Sync and your work will come down."
            : "Enter your passphrase to unlock the business."}
        </p>

        <form onSubmit={submit}>
          {restoring && (
            <>
              <button
                type="button"
                className="os-btn os-btn--ghost"
                style={{ width: "100%", marginBottom: 12 }}
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={15} />
                {backup ? backup.name : "Choose backup file"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setBackup({ name: file.name, text: await file.text() });
                  setError("");
                  e.target.value = "";
                }}
              />
            </>
          )}

          <label className="os-field">
            <span>Passphrase</span>
            <input
              className="os-input"
              type="password"
              value={pass}
              autoFocus={!restoring}
              autoComplete={setup && !restoring ? "new-password" : "current-password"}
              onChange={(e) => setPass(e.target.value)}
            />
          </label>

          {setup && !restoring && (
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
            disabled={busy || !pass || (restoring && !backup)}
          >
            {setup ? <ShieldCheck size={15} /> : <LockIcon size={15} />}
            {busy
              ? "Working…"
              : restoring
                ? "Open backup"
                : setup
                  ? "Create vault"
                  : "Unlock"}
          </button>
        </form>

        {setup && (
          <button
            className="os-btn os-btn--ghost os-btn--sm"
            style={{ width: "100%", marginTop: 10 }}
            onClick={() => {
              setMode(restoring ? "new" : "restore");
              setError("");
              setPass("");
              setConfirm("");
            }}
          >
            {restoring
              ? "Start a new vault instead"
              : "Already have a backup from another device?"}
          </button>
        )}

        <p className="os-small os-muted" style={{ marginTop: 18, marginBottom: 0 }}>
          Encrypted with AES-GCM on this device. Nothing is sent anywhere.
        </p>
      </div>
    </div>
  );
}
