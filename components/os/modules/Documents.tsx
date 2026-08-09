"use client";

import { useState } from "react";
import {
  ExternalLink,
  FolderSync,
  Link2,
  Lock,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Chip, Empty, Field, Modal, SectionTitle } from "../ui";
import { dateLabel, today, uid } from "@/lib/os/format";
import { DOC_LABEL, type DocCategory } from "@/lib/os/types";
import {
  embedUrl,
  folderUrl,
  listFolder,
  parseFolderId,
  signIn,
} from "@/lib/os/drive";

const BUILT_IN = Object.keys(DOC_LABEL).filter((k) => k !== "uncategorised");

/**
 * Business documents sit behind a second passphrase. Files live in Google
 * Drive — the linked folder is shown live, and signing in pulls its file
 * list into the register so documents are searchable and categorised here.
 */
export default function Documents() {
  const { vault, adminUnlocked, setAdminPassword, tryAdmin, lockAdmin, update } =
    useVault();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [managingCats, setManagingCats] = useState(false);
  const [filter, setFilter] = useState<DocCategory>("all");
  const [syncing, setSyncing] = useState(false);
  const [note, setNote] = useState("");
  const [folderInput, setFolderInput] = useState("");
  if (!vault) return null;

  const configured = !!vault.settings.adminHash;
  const custom = vault.docCategories ?? [];
  const label = (c: DocCategory) =>
    DOC_LABEL[c] ?? custom.find((x) => x.id === c)?.label ?? c;

  if (!adminUnlocked) {
    return (
      <div style={{ maxWidth: 420, margin: "40px auto" }}>
        <Card pad>
          <div className="os-flex" style={{ marginBottom: 12 }}>
            <Lock size={18} />
            <strong>
              {configured ? "Administrator access" : "Set an administrator password"}
            </strong>
          </div>
          <p className="os-small os-muted">
            {configured
              ? "This section holds registration, tax, insurance and legal records. It needs a second password."
              : "Choose a separate password for business documents. It is not the same as your login passphrase."}
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (!configured) {
                if (pw.length < 6) return setError("Use at least 6 characters.");
                if (pw !== confirm) return setError("The two entries don't match.");
                await setAdminPassword(pw);
                setPw("");
                setConfirm("");
                return;
              }
              const ok = await tryAdmin(pw);
              if (!ok) {
                setError("Incorrect password.");
                setPw("");
              }
            }}
          >
            <Field label="Administrator password">
              <input
                className="os-input"
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
            </Field>
            {!configured && (
              <Field label="Confirm password">
                <input
                  className="os-input"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </Field>
            )}
            {error && (
              <p className="os-small" style={{ color: "var(--os-danger)" }}>
                {error}
              </p>
            )}
            <button className="os-btn" style={{ width: "100%" }} disabled={!pw}>
              <ShieldCheck size={15} /> {configured ? "Unlock" : "Set password"}
            </button>
          </form>
        </Card>
      </div>
    );
  }

  const folderId = vault.settings.driveFolderId;
  const docs = vault.docs.filter((d) => filter === "all" || d.category === filter);
  const usedCategories = [...new Set(vault.docs.map((d) => d.category))];

  /** Pulls the folder listing and upserts it into the register by file id. */
  async function sync() {
    if (!folderId) return;
    const clientId = vault!.settings.driveClientId;
    if (!clientId) {
      setNote("Add a Google client ID below to sync the file list.");
      return;
    }
    setSyncing(true);
    setNote("");
    try {
      await signIn(clientId);
      const files = await listFolder(folderId);
      update((d) => {
        const seen = new Set<string>();
        for (const f of files) {
          seen.add(f.id);
          const existing = d.docs.find((x) => x.driveFileId === f.id);
          if (existing) {
            existing.title = f.name;
            existing.url = f.webViewLink ?? existing.url;
            existing.mimeType = f.mimeType;
            existing.modifiedAt = f.modifiedTime;
            existing.missingFromDrive = false;
          } else {
            d.docs.push({
              id: uid("doc_"),
              title: f.name,
              url:
                f.webViewLink ?? `https://drive.google.com/file/d/${f.id}/view`,
              category: "uncategorised",
              addedOn: today(),
              driveFileId: f.id,
              mimeType: f.mimeType,
              modifiedAt: f.modifiedTime,
            });
          }
        }
        /* Flag rather than delete — a file may have simply been moved. */
        for (const doc of d.docs) {
          if (doc.driveFileId && !seen.has(doc.driveFileId))
            doc.missingFromDrive = true;
        }
        d.settings.lastDriveSyncAt = new Date().toISOString();
      });
      setNote(`Synced ${files.length} file${files.length === 1 ? "" : "s"} from Drive.`);
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="os-stack">
      <Card pad>
        <div className="os-flex" style={{ marginBottom: 10 }}>
          <FolderSync size={17} />
          <strong>Linked Google Drive folder</strong>
          {folderId && (
            <a
              className="os-btn os-btn--ghost os-btn--sm os-right"
              href={folderUrl(folderId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink size={13} /> Open in Drive
            </a>
          )}
        </div>

        {folderId ? (
          <>
            <div className="os-flex" style={{ marginBottom: 12 }}>
              <button className="os-btn os-btn--sm" onClick={sync} disabled={syncing}>
                <RefreshCw size={13} /> {syncing ? "Syncing…" : "Sync file list"}
              </button>
              {vault.settings.lastDriveSyncAt && (
                <span className="os-small os-muted">
                  Last synced {dateLabel(vault.settings.lastDriveSyncAt.slice(0, 10))}
                </span>
              )}
              <button
                className="os-btn os-btn--ghost os-btn--sm os-right"
                onClick={() =>
                  update((d) => {
                    d.settings.driveFolderId = undefined;
                    d.settings.driveFolderUrl = undefined;
                  })
                }
              >
                Unlink
              </button>
            </div>
            <iframe
              title="Google Drive folder"
              src={embedUrl(folderId)}
              style={{
                width: "100%",
                height: 320,
                border: "1px solid var(--os-line)",
                borderRadius: 10,
                background: "#fff",
              }}
            />
            <p className="os-small os-muted" style={{ marginTop: 8 }}>
              The live view above only renders if the folder is shared with
              &ldquo;anyone with the link&rdquo;. For a private folder, use{" "}
              <strong>Sync file list</strong> instead — it signs in as you and
              keeps the folder private.
            </p>
          </>
        ) : (
          <>
            <p className="os-small os-muted">
              Paste the folder&rsquo;s Drive link. Anything you add to that folder
              afterwards shows up here.
            </p>
            <div className="os-row">
              <input
                className="os-input"
                placeholder="https://drive.google.com/drive/folders/…"
                value={folderInput}
                onChange={(e) => setFolderInput(e.target.value)}
              />
              <button
                className="os-btn os-shrink"
                onClick={() => {
                  const id = parseFolderId(folderInput);
                  if (!id) return setNote("That doesn't look like a Drive folder link.");
                  update((d) => {
                    d.settings.driveFolderId = id;
                    d.settings.driveFolderUrl = folderInput.trim();
                  });
                  setFolderInput("");
                  setNote("");
                }}
              >
                <Link2 size={14} /> Link folder
              </button>
            </div>
          </>
        )}

        <details style={{ marginTop: 12 }}>
          <summary className="os-small os-muted" style={{ cursor: "pointer" }}>
            Google sign-in setup (needed for private folders and device sync)
          </summary>
          <div style={{ marginTop: 10 }}>
            <Field label="Google OAuth client ID">
              <input
                className="os-input"
                placeholder="…apps.googleusercontent.com"
                value={vault.settings.driveClientId ?? ""}
                onChange={(e) =>
                  update((d) => void (d.settings.driveClientId = e.target.value.trim()))
                }
              />
            </Field>
            <p className="os-small os-muted">
              In Google Cloud Console: create a project, enable the{" "}
              <strong>Google Drive API</strong>, then create an OAuth 2.0 Client ID
              of type <strong>Web application</strong> and add{" "}
              <code>https://mk-cybercode.github.io</code> as an authorised
              JavaScript origin. Paste the client ID here.
            </p>
          </div>
        </details>

        {note && (
          <p className="os-small" style={{ marginTop: 10, color: "var(--os-accent)" }}>
            {note}
          </p>
        )}
      </Card>

      <div className="os-flex">
        <div className="os-stages">
          <button
            className="os-stage-pip"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All ({vault.docs.length})
          </button>
          {usedCategories.map((c) => (
            <button
              key={c}
              className="os-stage-pip"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {label(c)} ({vault.docs.filter((d) => d.category === c).length})
            </button>
          ))}
        </div>
        <div className="os-flex os-right">
          <button
            className="os-btn os-btn--ghost os-btn--sm"
            onClick={() => setManagingCats(true)}
          >
            Categories
          </button>
          <button className="os-btn os-btn--ghost os-btn--sm" onClick={lockAdmin}>
            <Lock size={14} /> Lock
          </button>
          <button className="os-btn" onClick={() => setAdding(true)}>
            <Plus size={15} /> Add document
          </button>
        </div>
      </div>

      {docs.length ? (
        <div className="os-list">
          {docs.map((d) => (
            <div className="os-list-row" key={d.id}>
              <select
                className="os-select"
                style={{ maxWidth: 190 }}
                value={d.category}
                onChange={(e) =>
                  update((v) => {
                    const t = v.docs.find((x) => x.id === d.id);
                    if (t) t.category = e.target.value;
                  })
                }
              >
                <option value="uncategorised">Uncategorised</option>
                {BUILT_IN.map((c) => (
                  <option key={c} value={c}>
                    {DOC_LABEL[c]}
                  </option>
                ))}
                {custom.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
              <strong>{d.title}</strong>
              {d.driveFileId && <Chip tone="accent">Drive</Chip>}
              {d.missingFromDrive && <Chip tone="danger">Not in folder</Chip>}
              <span className="os-small os-muted">
                {d.modifiedAt
                  ? dateLabel(d.modifiedAt.slice(0, 10))
                  : dateLabel(d.addedOn)}
              </span>
              <a
                className="os-btn os-btn--ghost os-btn--sm os-push"
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={13} /> Open
              </a>
              <button
                className="os-btn os-btn--ghost os-btn--sm"
                onClick={() => update((v) => void (v.docs = v.docs.filter((x) => x.id !== d.id)))}
                aria-label="Remove"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <Empty
          title="No documents registered"
          body="Link your Drive folder above and sync, or add a single document link by hand."
          action={
            <button className="os-btn" onClick={() => setAdding(true)}>
              <Plus size={15} /> Add document
            </button>
          }
        />
      )}

      {adding && <DocForm onClose={() => setAdding(false)} />}
      {managingCats && <CategoryManager onClose={() => setManagingCats(false)} />}
    </div>
  );
}

function CategoryManager({ onClose }: { onClose: () => void }) {
  const { vault, update } = useVault();
  const [name, setName] = useState("");
  if (!vault) return null;
  const custom = vault.docCategories ?? [];

  return (
    <Modal title="Document categories" onClose={onClose}>
      <SectionTitle>Built in</SectionTitle>
      <div className="os-flex">
        {BUILT_IN.map((c) => (
          <Chip key={c}>{DOC_LABEL[c]}</Chip>
        ))}
      </div>

      <SectionTitle>Your categories</SectionTitle>
      {custom.length ? (
        <div className="os-list">
          {custom.map((c) => (
            <div className="os-list-row" key={c.id}>
              <input
                className="os-input"
                value={c.label}
                onChange={(e) =>
                  update((d) => {
                    const t = d.docCategories.find((x) => x.id === c.id);
                    if (t) t.label = e.target.value;
                  })
                }
              />
              <button
                className="os-btn os-btn--ghost os-btn--sm os-push"
                onClick={() =>
                  update((d) => {
                    d.docCategories = d.docCategories.filter((x) => x.id !== c.id);
                    /* Don't orphan documents that used it. */
                    d.docs.forEach((doc) => {
                      if (doc.category === c.id) doc.category = "uncategorised";
                    });
                  })
                }
                aria-label="Delete category"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="os-small os-muted">None yet.</p>
      )}

      <div className="os-row" style={{ marginTop: 14 }}>
        <input
          className="os-input"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              update((d) =>
                d.docCategories.push({ id: uid("dc_"), label: name.trim() })
              );
              setName("");
            }
          }}
        />
        <button
          className="os-btn os-shrink"
          disabled={!name.trim()}
          onClick={() => {
            update((d) => d.docCategories.push({ id: uid("dc_"), label: name.trim() }));
            setName("");
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>
    </Modal>
  );
}

function DocForm({ onClose }: { onClose: () => void }) {
  const { vault, update } = useVault();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<DocCategory>("invoice");
  const [notes, setNotes] = useState("");
  if (!vault) return null;
  const custom = vault.docCategories ?? [];

  return (
    <Modal
      title="Register a document"
      onClose={onClose}
      footer={
        <>
          <button className="os-btn os-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            className="os-btn"
            disabled={!title || !url}
            onClick={() => {
              update((d) =>
                d.docs.push({
                  id: uid("doc_"),
                  title,
                  url,
                  category,
                  notes,
                  addedOn: today(),
                  brandAsset: category === "brand",
                })
              );
              onClose();
            }}
          >
            Save
          </button>
        </>
      }
    >
      <Field label="Title">
        <input
          className="os-input"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>
      <Field label="Link (Google Drive, Dropbox, anywhere)">
        <input
          className="os-input"
          placeholder="https://drive.google.com/…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </Field>
      <div className="os-row">
        <Field label="Category">
          <select
            className="os-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {BUILT_IN.map((c) => (
              <option key={c} value={c}>
                {DOC_LABEL[c]}
              </option>
            ))}
            {custom.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Notes">
          <input
            className="os-input"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
