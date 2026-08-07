"use client";

import { useState } from "react";
import { ExternalLink, Lock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useVault } from "../VaultProvider";
import { Card, Chip, Empty, Field, Modal } from "../ui";
import { dateLabel, today, uid } from "@/lib/os/format";
import { DOC_LABEL, type DocCategory } from "@/lib/os/types";

const CATEGORIES = Object.keys(DOC_LABEL) as DocCategory[];

/**
 * Business documents sit behind a second passphrase, separate from the login.
 * Files themselves live in Drive — this keeps the register, the categories
 * and the links, so nothing large has to be carried in the vault.
 */
export default function Documents() {
  const { vault, adminUnlocked, setAdminPassword, tryAdmin, lockAdmin, update } =
    useVault();
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<DocCategory | "all">("all");
  if (!vault) return null;

  const configured = !!vault.settings.adminHash;

  if (!adminUnlocked) {
    return (
      <div style={{ maxWidth: 420, margin: "40px auto" }}>
        <Card pad>
          <div className="os-flex" style={{ marginBottom: 12 }}>
            <Lock size={18} />
            <strong>{configured ? "Administrator access" : "Set an administrator password"}</strong>
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

  const docs = vault.docs.filter((d) => filter === "all" || d.category === filter);

  return (
    <div className="os-stack">
      <div className="os-flex">
        <div className="os-stages">
          <button
            className="os-stage-pip"
            aria-pressed={filter === "all"}
            onClick={() => setFilter("all")}
          >
            All ({vault.docs.length})
          </button>
          {CATEGORIES.filter((c) => vault.docs.some((d) => d.category === c)).map((c) => (
            <button
              key={c}
              className="os-stage-pip"
              aria-pressed={filter === c}
              onClick={() => setFilter(c)}
            >
              {DOC_LABEL[c]}
            </button>
          ))}
        </div>
        <div className="os-flex os-right">
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
              <Chip tone={d.brandAsset ? "caramel" : undefined}>{DOC_LABEL[d.category]}</Chip>
              <strong>{d.title}</strong>
              <span className="os-small os-muted">{dateLabel(d.addedOn)}</span>
              {d.notes && <span className="os-small os-muted">· {d.notes}</span>}
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
          body="Keep the files themselves in Google Drive — register the link here so everything is findable in one place, behind this password."
          action={
            <button className="os-btn" onClick={() => setAdding(true)}>
              <Plus size={15} /> Add document
            </button>
          }
        />
      )}

      {adding && <DocForm onClose={() => setAdding(false)} />}
    </div>
  );
}

function DocForm({ onClose }: { onClose: () => void }) {
  const { update } = useVault();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<DocCategory>("invoice");
  const [notes, setNotes] = useState("");

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
            onChange={(e) => setCategory(e.target.value as DocCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {DOC_LABEL[c]}
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
