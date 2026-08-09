"use client";

import { useRef, useState } from "react";
import {
  CloudDownload,
  CloudUpload,
  Download,
  LogOut,
  Trash2,
  Upload,
} from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Field, SectionTitle } from "../ui";
import { dateLabel } from "@/lib/os/format";

export default function SettingsModule() {
  const { vault, update, exportBackup, importBackup, lock, wipe, syncUp, syncDown } =
    useVault();
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [busy, setBusy] = useState("");
  const [pullPass, setPullPass] = useState("");
  const [showPull, setShowPull] = useState(false);
  if (!vault) return null;

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  }

  return (
    <div className="os-stack" style={{ maxWidth: 720 }}>
      <Card pad>
        <SectionTitle>Business</SectionTitle>
        <div className="os-row">
          <Field label="Business name">
            <input
              className="os-input"
              value={vault.settings.businessName}
              onChange={(e) =>
                update((d) => void (d.settings.businessName = e.target.value))
              }
            />
          </Field>
          <Field label="Capital loan">
            <input
              className="os-input"
              type="number"
              value={vault.settings.loanCapital}
              onChange={(e) =>
                update((d) => void (d.settings.loanCapital = Number(e.target.value)))
              }
            />
          </Field>
          <Field label="Waste allowance (%)">
            <input
              className="os-input"
              type="number"
              value={vault.settings.wastePct}
              onChange={(e) =>
                update((d) => void (d.settings.wastePct = Number(e.target.value)))
              }
            />
          </Field>
        </div>
        <Field label="Theme">
          <select
            className="os-select"
            value={vault.settings.theme}
            onChange={(e) =>
              update(
                (d) =>
                  void (d.settings.theme = e.target.value as "light" | "dark" | "system")
              )
            }
          >
            <option value="system">Match my device</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
      </Card>

      <Card pad>
        <SectionTitle>Sync across devices</SectionTitle>
        <p className="os-small os-muted">
          Your data is stored on this device, so a phone and a laptop start out
          separate. Backing up to Drive and pulling it down on the other device
          keeps them in step. What goes to Drive stays encrypted — the
          passphrase is still needed to open it.
        </p>
        {!vault.settings.driveClientId ? (
          <p className="os-small" style={{ color: "var(--os-caramel)" }}>
            Add a Google OAuth client ID under Documents → Google sign-in setup
            first.
          </p>
        ) : (
          <>
            <div className="os-flex">
              <button
                className="os-btn"
                disabled={!!busy}
                onClick={async () => {
                  setBusy("up");
                  try {
                    flash(await syncUp(vault.settings.driveClientId!));
                  } catch (e) {
                    flash(e instanceof Error ? e.message : "Backup failed.");
                  } finally {
                    setBusy("");
                  }
                }}
              >
                <CloudUpload size={15} />
                {busy === "up" ? "Backing up…" : "Back up to Drive"}
              </button>
              <button
                className="os-btn os-btn--ghost"
                disabled={!!busy}
                onClick={() => setShowPull((v) => !v)}
              >
                <CloudDownload size={15} /> Pull from Drive
              </button>
            </div>
            {showPull && (
              <div style={{ marginTop: 12 }}>
                <Field label="Passphrase used on the other device">
                  <input
                    className="os-input"
                    type="password"
                    value={pullPass}
                    onChange={(e) => setPullPass(e.target.value)}
                  />
                </Field>
                <button
                  className="os-btn os-btn--sm"
                  disabled={!pullPass || !!busy}
                  onClick={async () => {
                    setBusy("down");
                    try {
                      flash(await syncDown(vault.settings.driveClientId!, pullPass));
                      setPullPass("");
                      setShowPull(false);
                    } catch (e) {
                      flash(e instanceof Error ? e.message : "Restore failed.");
                    } finally {
                      setBusy("");
                    }
                  }}
                >
                  {busy === "down" ? "Restoring…" : "Replace this device's data"}
                </button>
                <p className="os-small os-muted" style={{ marginTop: 8 }}>
                  This overwrites what is on this device with the Drive copy — back
                  up here first if this device has newer work.
                </p>
              </div>
            )}
          </>
        )}
      </Card>

      <Card pad>
        <SectionTitle>Backup file</SectionTitle>
        <p className="os-small os-muted">
          Your data lives encrypted on this device only. Export a backup, save it
          to Drive, then open it on your phone — on a device with no vault yet,
          the unlock screen offers <strong>Already have a backup?</strong>. The
          exported file is encrypted, so it needs this same passphrase.
          {vault.settings.lastBackupAt && (
            <>
              {" "}
              Last export:{" "}
              <strong>{dateLabel(vault.settings.lastBackupAt.slice(0, 10))}</strong>.
            </>
          )}
        </p>
        <div className="os-flex">
          <button
            className="os-btn"
            onClick={() => {
              exportBackup();
              flash("Backup downloaded — save it to Drive");
            }}
          >
            <Download size={15} /> Export backup
          </button>
          <button
            className="os-btn os-btn--ghost"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} /> Restore from backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const ok = importBackup(await file.text());
              flash(ok ? "Backup restored" : "That file could not be read");
              e.target.value = "";
            }}
          />
        </div>
      </Card>

      <Card pad>
        <SectionTitle>Security</SectionTitle>
        <p className="os-small os-muted">
          The vault is encrypted with AES-GCM using a key stretched from your
          passphrase. Business documents carry a second password, set the first
          time you open that section.
        </p>
        <div className="os-flex">
          <button className="os-btn os-btn--ghost" onClick={lock}>
            <LogOut size={15} /> Lock now
          </button>
          {!confirmWipe ? (
            <button
              className="os-btn os-btn--danger os-btn--sm os-right"
              onClick={() => setConfirmWipe(true)}
            >
              <Trash2 size={13} /> Erase everything
            </button>
          ) : (
            <span className="os-flex os-right">
              <span className="os-small">Erase all data on this device?</span>
              <button
                className="os-btn os-btn--ghost os-btn--sm"
                onClick={() => setConfirmWipe(false)}
              >
                Cancel
              </button>
              <button
                className="os-btn os-btn--danger os-btn--sm"
                onClick={() => wipe()}
              >
                Erase
              </button>
            </span>
          )}
        </div>
      </Card>

      {toast && <div className="os-toast">{toast}</div>}
    </div>
  );
}
