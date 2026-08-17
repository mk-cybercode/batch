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
import { ensureToken, pullVault, pushVault, signIn } from "@/lib/os/drive";
import {
  currentAccount,
  fetchVault,
  saveVault,
  signIn as cloudSignIn,
  signOut as cloudSignOut,
  signUp as cloudSignUp,
  type Account,
} from "@/lib/os/cloud";

export type SyncState = "off" | "idle" | "syncing" | "error";

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
  syncState: SyncState;
  syncMessage: string;
  /** Runs a pull-then-push cycle now. */
  syncNow: () => Promise<void>;
  /** The cloud account this device is signed into, if any. */
  account: Account | null;
  cloudRegister: (email: string, password: string) => Promise<string>;
  cloudLogin: (email: string, password: string) => Promise<void>;
  cloudLogout: () => Promise<void>;
}

const VaultCtx = createContext<Ctx | null>(null);

export function useVault() {
  const ctx = useContext(VaultCtx);
  if (!ctx) throw new Error("useVault must be used inside VaultProvider");
  return ctx;
}

const ADMIN_SALT = "batch-os-admin";

/* Whether this browser has already shaken hands with an account. Kept outside
   the vault because it describes the device, not the business, and it has to
   survive the vault being replaced by the copy that comes down. */
const JOINED = "batch-os-joined:";
function hasJoined(accountId: string): boolean {
  try {
    return localStorage.getItem(JOINED + accountId) === "1";
  } catch {
    return false;
  }
}
function markJoined(accountId: string): void {
  try {
    localStorage.setItem(JOINED + accountId, "1");
  } catch {
    /* Private browsing with storage denied — sync still works, the device
       just re-runs the join check next time. */
  }
}

/** True while a vault holds no work of its own — a device set up but not yet
 *  used. Only the collections a fresh vault leaves empty are counted; the
 *  starter suppliers, stock lines, recipe and plan milestones are furniture,
 *  not work. Such a copy must never overwrite one that has real records. */
function isUntouched(v: Vault): boolean {
  return (
    v.purchases.length === 0 &&
    v.production.length === 0 &&
    v.sales.length === 0 &&
    v.expenses.length === 0 &&
    v.customers.length === 0 &&
    v.equipment.length === 0 &&
    v.surveys.length === 0 &&
    v.docs.length === 0 &&
    v.adjustments.length === 0
  );
}

/** Returned by cloudRegister when the project still asks for email
 *  confirmation, so the form knows to offer the link again. */
export const CONFIRM_EMAIL =
  "Account made. Open the confirmation link in your email on this device, then come back here.";

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
  /* Held for this session only, so a copy sealed on another device — which
     carries its own salt — can be opened without asking again. */
  const passRef = useRef<string | null>(null);
  const vaultRef = useRef<Vault | null>(null);
  const lastPushed = useRef<number>(0);
  const applyingRemote = useRef(false);
  const [syncState, setSyncState] = useState<SyncState>("off");
  const [syncMessage, setSyncMessage] = useState("");
  const [account, setAccount] = useState<Account | null>(null);
  const accountRef = useRef<Account | null>(null);

  useEffect(() => {
    vaultRef.current = vault;
  }, [vault]);

  useEffect(() => {
    accountRef.current = account;
  }, [account]);

  /* A signed-in session survives a reload, so pick it back up on start. */
  useEffect(() => {
    void currentAccount().then(setAccount).catch(() => setAccount(null));
  }, []);

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
      /* Stamp every change so the newer of two devices can be identified. */
      draft.settings.updatedAt = Date.now();
      return draft;
    });
  }, []);

  const create = useCallback(async (passphrase: string) => {
    const salt = randomSalt();
    const key = await deriveKey(passphrase, salt);
    keyRef.current = key;
    saltRef.current = salt;
    passRef.current = passphrase;
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
    passRef.current = passphrase;
    /* Backfill collections added after this vault was created. */
    setVault({ ...seedVault(), ...data });
    setStatus("open");
    return true;
  }, []);

  const lock = useCallback(() => {
    keyRef.current = null;
    saltRef.current = null;
    passRef.current = null;
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
      passRef.current = passphrase;
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
      passRef.current = passphrase;
      const merged = { ...seedVault(), ...data };
      await writeSealed(remote.sealed);
      setVault(merged);
      setStatus("open");
      return "Restored from Google Drive.";
    },
    []
  );

  /**
   * Automatic sync. On opening, the newer of the local and Drive copies
   * wins; afterwards every change is pushed a few seconds later. It is
   * last-write-wins by timestamp, which suits one person moving between
   * their own devices — two devices edited at once will not merge.
   */
  const syncNow = useCallback(async () => {
    const key = keyRef.current;
    const salt = saltRef.current;
    const current = vaultRef.current;
    const acct = accountRef.current;
    if (!key || !salt || !current || !acct) return;

    setSyncState("syncing");
    try {
      const remote = await fetchVault();
      const localStamp = current.settings.updatedAt ?? 0;

      if (remote) {
        /* Each device seals with its own salt, so the stored copy needs a key
           derived from the passphrase and *that* salt — the local key won't
           open it. */
        const pass = passRef.current;
        const remoteKey = pass
          ? await deriveKey(pass, saltFromSealed(remote.sealed))
          : key;
        const opened = await unseal<Vault>(remoteKey, remote.sealed);

        if (!opened) {
          setSyncState("error");
          setSyncMessage(
            "The cloud copy was locked with a different passphrase — sync paused so nothing is overwritten."
          );
          return;
        }
        /* The first time a device meets an account it is joining, not
           competing: a vault still carrying nothing but its starter furniture
           takes what is already there, whatever the clocks say. A device set
           up minutes ago stamps itself the moment anything is touched — a
           theme change is enough — and would otherwise win the comparison and
           wipe the real copy. After that first handshake the rule is strictly
           by timestamp, so work done here is never thrown away. */
        const joining = !hasJoined(acct.id) && isUntouched(current);
        if (remote.updatedAt > localStamp || joining) {
          applyingRemote.current = true;
          lastPushed.current = remote.updatedAt;
          setVault({ ...seedVault(), ...opened });
          markJoined(acct.id);
          setSyncState("idle");
          setSyncMessage("Updated from your other device");
          return;
        }
      }
      markJoined(acct.id);

      if (localStamp !== lastPushed.current) {
        await saveVault(acct.id, await seal(key, salt, current), localStamp);
        lastPushed.current = localStamp;
      }
      setSyncState("idle");
      setSyncMessage("");
    } catch (e) {
      setSyncState("error");
      setSyncMessage(e instanceof Error ? e.message : "Sync failed");
    }
  }, []);

  /* Pull once as soon as the vault opens on a signed-in device. */
  useEffect(() => {
    if (status !== "open" || !account) return;
    void syncNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, account]);

  /* Push a few seconds after the last change, so typing isn't uploaded
     keystroke by keystroke. */
  useEffect(() => {
    if (status !== "open" || !account || !vault) return;
    if (applyingRemote.current) {
      applyingRemote.current = false;
      return;
    }
    if ((vault.settings.updatedAt ?? 0) === lastPushed.current) return;
    const t = setTimeout(() => void syncNow(), 3000);
    return () => clearTimeout(t);
  }, [vault, status, account, syncNow]);

  /* Pick up changes made on another device while this one sat open. */
  useEffect(() => {
    if (status !== "open" || !account) return;
    const onFocus = () => void syncNow();
    window.addEventListener("focus", onFocus);
    const poll = setInterval(onFocus, 60_000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(poll);
    };
  }, [status, account, syncNow]);

  const cloudRegister = useCallback(async (email: string, password: string) => {
    const acct = await cloudSignUp(email, password);
    if (!acct) return CONFIRM_EMAIL;
    setAccount(acct);
    return "Account created — this device is now syncing.";
  }, []);

  const cloudLogin = useCallback(async (email: string, password: string) => {
    setAccount(await cloudSignIn(email, password));
  }, []);

  const cloudLogout = useCallback(async () => {
    await cloudSignOut();
    setAccount(null);
    setSyncState("off");
    setSyncMessage("");
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
      restoreFromFile,
      wipe,
      saving,
      syncUp,
      syncDown,
      syncState,
      syncMessage,
      syncNow,
      account,
      cloudRegister,
      cloudLogin,
      cloudLogout,
    }),
    [
      restoreFromFile,
      syncState,
      syncMessage,
      syncNow,
      account,
      cloudRegister,
      cloudLogin,
      cloudLogout,
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
