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
import type { Sealed } from "@/lib/os/crypto";
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
import { pullVault, pushVault, signIn } from "@/lib/os/drive";

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
  /** Opens a backup file on a device that has no vault yet. */
  restoreFromFile: (json: string, passphrase: string) => Promise<string>;
  wipe: () => Promise<void>;
  saving: boolean;
  /** Push this device's encrypted vault to Drive. */
  syncUp: (clientId: string) => Promise<string>;
  /** Pull the Drive copy and replace what's on this device. */
  syncDown: (clientId: string, passphrase: string) => Promise<string>;
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
    /* Backfill collections added after this vault was created. */
    setVault({ ...seedVault(), ...data });
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

  /** The exported file is the sealed vault, so a copy sitting in Drive or a
   *  chat thread is useless without the passphrase. */
  const exportBackup = useCallback(async () => {
    const key = keyRef.current;
    const salt = saltRef.current;
    if (!vault || !key || !salt) return;
    const stamp = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(await seal(key, salt, vault), null, 2)], {
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

  /** Plain-vault backups from earlier versions still open. */
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

  /**
   * Opens a backup on a device with no vault of its own — the phone case.
   * Accepts both the sealed export and the older plain-JSON one.
   */
  const restoreFromFile = useCallback(
    async (json: string, passphrase: string) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        throw new Error("That file isn't a Batch OS backup.");
      }
      const maybeSealed = parsed as Sealed;
      let data: Vault | null = null;
      let salt: Uint8Array;
      let key: CryptoKey;

      if (maybeSealed?.salt && maybeSealed?.iv && maybeSealed?.data) {
        salt = saltFromSealed(maybeSealed);
        key = await deriveKey(passphrase, salt);
        data = await unseal<Vault>(key, maybeSealed);
        if (!data) throw new Error("That passphrase doesn't open this backup.");
      } else if ((parsed as Vault)?.settings) {
        data = parsed as Vault;
        salt = randomSalt();
        key = await deriveKey(passphrase, salt);
      } else {
        throw new Error("That file isn't a Batch OS backup.");
      }

      const merged: Vault = { ...seedVault(), ...data };
      keyRef.current = key;
      saltRef.current = salt;
      await writeSealed(await seal(key, salt, merged));
      setVault(merged);
      setStatus("open");
      return "Backup opened on this device.";
    },
    []
  );

  /**
   * Drive holds the same sealed blob written locally, so the passphrase is
   * still required to open it and Google only ever stores ciphertext.
   */
  const syncUp = useCallback(
    async (clientId: string) => {
      const key = keyRef.current;
      const salt = saltRef.current;
      if (!key || !salt || !vault) throw new Error("Unlock the vault first.");
      await signIn(clientId);
      const stamped: Vault = {
        ...vault,
        settings: { ...vault.settings, lastBackupAt: new Date().toISOString() },
      };
      await pushVault(await seal(key, salt, stamped));
      setVault(stamped);
      return "Backed up to Google Drive.";
    },
    [vault]
  );

  const syncDown = useCallback(
    async (clientId: string, passphrase: string) => {
      await signIn(clientId);
      const remote = await pullVault();
      if (!remote) throw new Error("No vault found in Drive yet — back up first.");
      const salt = saltFromSealed(remote.sealed);
      const key = await deriveKey(passphrase, salt);
      const data = await unseal<Vault>(key, remote.sealed);
      if (!data)
        throw new Error("That passphrase doesn't open the Drive copy.");
      keyRef.current = key;
      saltRef.current = salt;
      const merged = { ...seedVault(), ...data };
      await writeSealed(remote.sealed);
      setVault(merged);
      setStatus("open");
      return "Restored from Google Drive.";
    },
    []
  );

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
      restoreFromFile,
      wipe,
      saving,
      syncUp,
      syncDown,
    }),
    [
      restoreFromFile,
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
      syncUp,
      syncDown,
    ]
  );

  return <VaultCtx.Provider value={value}>{children}</VaultCtx.Provider>;
}
