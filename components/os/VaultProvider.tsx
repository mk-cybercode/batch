"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Vault } from "@/lib/os/types";
import {
  deriveKey,
  hashSecret,
  randomSalt,
  saltFromSealed,
  seal,
  unseal,
} from "@/lib/os/crypto";
import { clearVault, readSealed, writeSealed } from "@/lib/os/store";
import { seedVault } from "@/lib/os/seed";

type Status = "loading" | "setup" | "locked" | "open";

interface Ctx {
  status: Status;
  vault: Vault | null;
  /** Applies a mutation to a draft and persists it. */
  update: (fn: (draft: Vault) => void) => void;
  create: (passphrase: string) => Promise<void>;
  unlock: (passphrase: string) => Promise<boolean>;
  lock: () => void;
  /** Documents gate — separate from the login passphrase. */
  adminUnlocked: boolean;
  setAdminPassword: (pw: string) => Promise<void>;
  tryAdmin: (pw: string) => Promise<boolean>;
  lockAdmin: () => void;
  exportBackup: () => void;
  importBackup: (json: string) => boolean;
  wipe: () => Promise<void>;
  saving: boolean;
}

const VaultCtx = createContext<Ctx | null>(null);

export function useVault() {
  const ctx = useContext(VaultCtx);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}

const ADMIN_SALT = "batch-os-admin";

export default function VaultProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [vault, setVault] = useState<Vault | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const keyRef = useRef<CryptoKey | null>(null);
  const saltRef = useRef<Uint8Array | null>(null);
  const queued = useRef<Vault | null>(null);

  useEffect(() => {
    readSealed()
      .then((s) => setStatus(s ? "locked" : "setup"))
      .catch(() => setStatus("setup"));
  }, []);

  /* Debounced write — typing in a form shouldn't re-encrypt on every keypress. */
  const persist = useCallback((next: Vault) => {
    queued.current = next;
    setSaving(true);
    const run = async () => {
      const key = keyRef.current;
      const salt = saltRef.current;
      const pending = queued.current;
      if (!key || !salt || !pending) return;
      queued.current = null;
      await writeSealed(await seal(key, salt, pending));
      setSaving(false);
    };
    const t = setTimeout(run, 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!vault || status !== "open") return;
    const cancel = persist(vault);
    return cancel;
  }, [vault, status, persist]);

  const update = useCallback((fn: (draft: Vault) => void) => {
    setVault((current) => {
      if (!current) return current;
      const draft = structuredClone(current);
      fn(draft);
      return draft;
    });
  }, []);

  const create = useCallback(async (passphrase: string) => {
    const salt = randomSalt();
    const key = await deriveKey(passphrase, salt);
    keyRef.current = key;
    saltRef.current = salt;
    const fresh = seedVault();
    await writeSealed(await seal(key, salt, fresh));
    setVault(fresh);
    setStatus("open");
  }, []);

  const unlock = useCallback(async (passphrase: string) => {
    const sealed = await readSealed();
    if (!sealed) return false;
    const salt = saltFromSealed(sealed);
    const key = await deriveKey(passphrase, salt);
    const data = await unseal<Vault>(key, sealed);
    if (!data) return false;
    keyRef.current = key;
    saltRef.current = salt;
    setVault(data);
    setStatus("open");
    return true;
  }, []);

  const lock = useCallback(() => {
    keyRef.current = null;
    saltRef.current = null;
    setVault(null);
    setAdminUnlocked(false);
    setStatus("locked");
  }, []);

  const setAdminPassword = useCallback(
    async (pw: string) => {
      const hash = await hashSecret(pw, ADMIN_SALT);
      update((d) => {
        d.settings.adminHash = hash;
      });
      setAdminUnlocked(true);
    },
    [update]
  );

  const tryAdmin = useCallback(
    async (pw: string) => {
      if (!vault?.settings.adminHash) return false;
      const ok = (await hashSecret(pw, ADMIN_SALT)) === vault.settings.adminHash;
      if (ok) setAdminUnlocked(true);
      return ok;
    },
    [vault]
  );

  const exportBackup = useCallback(() => {
    if (!vault) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(vault, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-os-backup-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(url);
    update((d) => {
      d.settings.lastBackupAt = new Date().toISOString();
    });
  }, [vault, update]);

  const importBackup = useCallback((json: string) => {
    try {
      const parsed = JSON.parse(json) as Vault;
      if (!parsed || typeof parsed !== "object" || !parsed.settings) return false;
      /* Tolerate backups made before a collection existed. */
      const merged: Vault = { ...seedVault(), ...parsed };
      setVault(merged);
      return true;
    } catch {
      return false;
    }
  }, []);

  const wipe = useCallback(async () => {
    await clearVault();
    keyRef.current = null;
    saltRef.current = null;
    setVault(null);
    setAdminUnlocked(false);
    setStatus("setup");
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      status,
      vault,
      update,
      create,
      unlock,
      lock,
      adminUnlocked,
      setAdminPassword,
      tryAdmin,
      lockAdmin: () => setAdminUnlocked(false),
      exportBackup,
      importBackup,
      wipe,
      saving,
    }),
    [
      status,
      vault,
      update,
      create,
      unlock,
      lock,
      adminUnlocked,
      setAdminPassword,
      tryAdmin,
      exportBackup,
      importBackup,
      wipe,
      saving,
    ]
  );

  return <VaultCtx.Provider value={value}>{children}</VaultCtx.Provider>;
}
