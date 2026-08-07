"use client";

import { useRef, useState } from "react";
import { Download, LogOut, Trash2, Upload } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Field, SectionTitle } from "../ui";
import { dateLabel } from "@/lib/os/format";

export default function SettingsModule() {
  const { vault, update, exportBackup, importBackup, lock, wipe } = useVault();
  const fileRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState("");
  const [confirmWipe, setConfirmWipe] = useState(false);
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
        <SectionTitle>Backup</SectionTitle>
        <p className="os-small os-muted">
          Your data lives encrypted on this device only. Export a backup regularly
          and keep it in Google Drive — that file is also how you move the business
          to a new phone or laptop.
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
