"use client";

import { useRef, useState } from "react";
import {
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  Eye,
  EyeOff,
  LogOut,
  MailCheck,
  RefreshCw,
  Trash2,
  Upload,
} from "lucide-react";
import { useVault, CONFIRM_EMAIL } from "../VaultProvider";
import { Card, Field, SectionTitle } from "../ui";
import { dateLabel } from "@/lib/os/format";
import { NEEDS_SETUP, SETUP_SQL, resendConfirmation } from "@/lib/os/cloud";

/** Supabase hands failures back in the URL fragment when a confirmation link
 *  is stale, so the page can say what went wrong instead of looking blank. */
function hashError(): string {
  if (typeof window === "undefined") return "";
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const code = hash.get("error_code");
  if (!code) return "";
  window.history.replaceState(null, "", window.location.pathname);
  return code.includes("expired")
    ? "That confirmation link had expired. Make the account again below, or use “Send the link again”."
    : (hash.get("error_description") ?? "").replace(/\+/g, " ") ||
        "The confirmation link didn't work.";
}

export default function SettingsModule() {
  const {
    vault,
    update,
    exportBackup,
    importBackup,
    lock,
    wipe,
    syncUp,
    syncDown,
    syncState,
    syncMessage,
    syncNow,
    account,
    cloudRegister,
    cloudLogin,
    cloudLogout,
  } = useVault();
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
        {account ? (
          <>
            <p className="os-small os-muted">
              Signed in as <strong>{account.email}</strong>. Every change is
              saved to the cloud a few seconds later and picked up by your other
              devices when you open them.
            </p>
            <div className="os-flex">
              <span className="os-chip">
                {syncState === "syncing"
                  ? "Syncing…"
                  : syncState === "error"
                    ? "Needs attention"
                    : "Up to date"}
              </span>
              {syncMessage && <span className="os-small os-muted">{syncMessage}</span>}
              <button
                className="os-btn os-btn--ghost os-btn--sm"
                onClick={() => void syncNow()}
              >
                <RefreshCw size={13} /> Sync now
              </button>
              <button
                className="os-btn os-btn--ghost os-btn--sm os-right"
                onClick={async () => {
                  await cloudLogout();
                  flash("Signed out of sync on this device.");
                }}
              >
                Sign out
              </button>
            </div>
            {syncMessage === NEEDS_SETUP && <SetupSql />}
            <p className="os-small os-muted" style={{ marginTop: 12 }}>
              What reaches the cloud is encrypted with your passphrase, so the
              database holds nothing readable. On a new device, sign in here and
              enter the same passphrase.
            </p>
          </>
        ) : (
          <CloudSignIn onDone={flash} />
        )}
      </Card>

      <Card pad>
        <SectionTitle>Google Drive (optional)</SectionTitle>
        <p className="os-small os-muted">
          A second copy in your own Drive, taken by hand. Not needed if you are
          signed in above.
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

/** The table and its access rules have to exist before anything can be stored,
 *  and it is a one-off, so the SQL is put on screen ready to copy rather than
 *  left in a file nobody will find. */
function SetupSql() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="os-note" style={{ marginTop: 12 }}>
      <p className="os-small">
        <strong>One thing left to do, once.</strong> Open your Supabase project
        → <strong>SQL Editor</strong> → <strong>New query</strong>, paste this
        in, and press <strong>Run</strong>. Then come back and press{" "}
        <strong>Sync now</strong>.
      </p>
      <pre className="os-sql">{SETUP_SQL}</pre>
      <button
        type="button"
        className="os-btn os-btn--ghost os-btn--sm"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(SETUP_SQL);
            setCopied(true);
            setTimeout(() => setCopied(false), 2400);
          } catch {
            setCopied(false);
          }
        }}
      >
        <Copy size={13} /> {copied ? "Copied" : "Copy the SQL"}
      </button>
    </div>
  );
}

/** Email + password for cloud sync. The passphrase stays separate — this
 *  proves who you are, the passphrase is what decrypts the data. */
function CloudSignIn({ onDone }: { onDone: (msg: string) => void }) {
  const { cloudRegister, cloudLogin } = useVault();
  /* Nobody has an account until they make one, so start on that. */
  const [mode, setMode] = useState<"in" | "up">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(() => hashError());
  const [awaiting, setAwaiting] = useState("");
  const [stuck, setStuck] = useState(false);
  const [show, setShow] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStuck(false);
    setBusy(true);
    /* Whitespace from autofill or a phone keyboard is invisible on screen but
       is not invisible to the server, so it never reaches it. */
    const addr = email.trim().toLowerCase();
    try {
      if (mode === "up") {
        const msg = await cloudRegister(addr, password);
        if (msg === CONFIRM_EMAIL) setAwaiting(addr);
        onDone(msg);
      } else {
        await cloudLogin(addr, password);
        onDone("Signed in — this device is now syncing.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "That didn't work.";
      if (msg.includes("Send the link again")) setAwaiting(addr);
      /* An account that exists but won't take the password is a dead end from
         inside the app — the way out is through the Supabase dashboard. */
      if (msg.includes("No account with that email") || msg.includes("already has an account"))
        setStuck(true);
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {stuck && (
        <div className="os-note" style={{ marginBottom: 14 }}>
          <p className="os-small">
            <strong>Account exists, password won&rsquo;t take?</strong> Then the
            password saved when it was first made isn&rsquo;t the one being typed
            now, and there is no way to see it. Clear it out and start again:
          </p>
          <p className="os-small">
            1. Supabase dashboard → <strong>Authentication</strong> →{" "}
            <strong>Users</strong>
            <br />
            2. Find the row for this email, open the <strong>…</strong> menu at
            its right, choose <strong>Delete user</strong>
            <br />
            3. Come back here, <strong>First time here</strong>, and make it
            again
          </p>
          <p className="os-small os-muted" style={{ margin: 0 }}>
            Nothing of yours is lost — that account only labels the device. Your
            business data sits encrypted on this laptop and is untouched by any
            of this.
          </p>
        </div>
      )}
      {awaiting && (
        <div className="os-note" style={{ marginBottom: 14 }}>
          <p className="os-small">
            Waiting on the confirmation email sent to <strong>{awaiting}</strong>
            . Open it on this device — the link only works once and expires after
            an hour.
          </p>
          <button
            type="button"
            className="os-btn os-btn--ghost os-btn--sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await resendConfirmation(awaiting);
                onDone("A fresh link is on its way.");
              } catch (err) {
                setError(err instanceof Error ? err.message : "Couldn't send it.");
              } finally {
                setBusy(false);
              }
            }}
          >
            <MailCheck size={13} /> Send the link again
          </button>
        </div>
      )}
      <div className="os-stages" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className="os-stage-pip"
          aria-pressed={mode === "up"}
          onClick={() => {
            setMode("up");
            setError("");
          }}
        >
          First time here
        </button>
        <button
          type="button"
          className="os-stage-pip"
          aria-pressed={mode === "in"}
          onClick={() => {
            setMode("in");
            setError("");
          }}
        >
          I already have an account
        </button>
      </div>
      <p className="os-small os-muted">
        {mode === "up"
          ? "Choose any email and password — this is a new login you are creating now, just to link your devices. It isn't your passphrase and isn't your Supabase login."
          : "Use the email and password you created here on your other device."}
      </p>
      <form onSubmit={submit}>
        <div className="os-row">
          <Field label="Email">
            <input
              className="os-input"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <div className="os-reveal">
              <input
                className="os-input"
                type={show ? "text" : "password"}
                autoComplete={mode === "up" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
        </div>
        <p className="os-small os-muted" style={{ marginTop: -4 }}>
          Tap the eye to check what you typed — phone keyboards like to
          capitalise the first letter, and the password is case-sensitive.
        </p>
        {error && (
          <p className="os-small" style={{ color: "var(--os-danger)" }}>
            {error}
          </p>
        )}
        <div className="os-flex">
          <button className="os-btn" disabled={busy || !email || !password}>
            {busy
              ? "Working…"
              : mode === "up"
                ? "Create my account"
                : "Sign in"}
          </button>
        </div>
      </form>
    </>
  );
}
