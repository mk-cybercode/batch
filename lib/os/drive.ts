/**
 * Google Drive integration.
 *
 * Two jobs, one sign-in:
 *  1. list the linked business-documents folder so files added in Drive show
 *     up here without being re-typed;
 *  2. hold the encrypted vault so the same data opens on every device.
 *
 * The access token is kept in memory only, and the vault file uploaded to
 * Drive is the same sealed ciphertext stored locally — Google never sees a
 * readable copy, and the passphrase never leaves the browser.
 */

import type { Sealed } from "./crypto";

export const VAULT_FILENAME = "batch-os-vault.json";

/** drive.readonly lists the documents folder; drive.file covers our own vault file. */
const SCOPES = [
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
].join(" ");

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
}

/** Accepts a full folder URL or a bare id. */
export function parseFolderId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  const m =
    s.match(/\/folders\/([a-zA-Z0-9_-]+)/) ??
    s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  return /^[a-zA-Z0-9_-]{10,}$/.test(s) ? s : null;
}

export function embedUrl(folderId: string): string {
  return `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
}

export function folderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

/* ------------------------------------------------------------------ */
/* Auth                                                                */
/* ------------------------------------------------------------------ */

interface TokenClient {
  requestAccessToken: (opts?: { prompt?: string }) => void;
  callback: (resp: { access_token?: string; error?: string }) => void;
}
interface GoogleGlobal {
  accounts: {
    oauth2: {
      initTokenClient: (cfg: {
        client_id: string;
        scope: string;
        callback: (resp: { access_token?: string; error?: string }) => void;
      }) => TokenClient;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleGlobal;
  }
}

let gisPromise: Promise<void> | null = null;

function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Google sign-in."));
    document.head.appendChild(s);
  });
  return gisPromise;
}

let token: string | null = null;
let tokenExpiry = 0;

export function hasToken(): boolean {
  return !!token && Date.now() < tokenExpiry;
}

export function forgetToken(): void {
  token = null;
  tokenExpiry = 0;
}

/**
 * Opens Google's consent popup and keeps the token in memory for this
 * session only. `silent` reuses an existing Google session without showing
 * anything, which is what lets background syncing stay out of the way.
 */
export function signIn(clientId: string, silent = false): Promise<string> {
  return loadGis().then(
    () =>
      new Promise<string>((resolve, reject) => {
        const oauth2 = window.google?.accounts?.oauth2;
        if (!oauth2) return reject(new Error("Google sign-in is unavailable."));
        const client = oauth2.initTokenClient({
          client_id: clientId,
          scope: SCOPES,
          callback: (resp) => {
            if (resp.access_token) {
              token = resp.access_token;
              /* Google tokens last an hour; renew a little early. */
              tokenExpiry = Date.now() + 55 * 60 * 1000;
              resolve(resp.access_token);
            } else {
              reject(new Error(resp.error || "Sign-in was cancelled."));
            }
          },
        });
        client.requestAccessToken({ prompt: silent ? "none" : "" });
      })
  );
}

/** Returns a usable token, renewing quietly when one has expired. */
export async function ensureToken(clientId: string): Promise<string> {
  if (hasToken()) return token as string;
  return signIn(clientId, true);
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  if (!token) throw new Error("Not signed in to Google.");
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
  });
  if (res.status === 401) {
    token = null;
    throw new Error("Google session expired — sign in again.");
  }
  if (!res.ok) {
    throw new Error(`Drive error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Documents folder                                                    */
/* ------------------------------------------------------------------ */

export async function listFolder(folderId: string): Promise<DriveFile[]> {
  const out: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken, files(id, name, mimeType, webViewLink, modifiedTime)",
      pageSize: "200",
      orderBy: "name",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const page = await api<{ files: DriveFile[]; nextPageToken?: string }>(
      `https://www.googleapis.com/drive/v3/files?${params}`
    );
    out.push(...(page.files ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);
  return out;
}

/* ------------------------------------------------------------------ */
/* Vault sync                                                          */
/* ------------------------------------------------------------------ */

export interface RemoteVault {
  fileId: string;
  sealed: Sealed;
  modifiedTime?: string;
}

async function findVaultFile(): Promise<{ id: string; modifiedTime?: string } | null> {
  const params = new URLSearchParams({
    q: `name = '${VAULT_FILENAME}' and trashed = false`,
    fields: "files(id, modifiedTime)",
    pageSize: "10",
    /* drive.file scope narrows this to files this app created. */
    spaces: "drive",
  });
  const res = await api<{ files: { id: string; modifiedTime?: string }[] }>(
    `https://www.googleapis.com/drive/v3/files?${params}`
  );
  return res.files?.[0] ?? null;
}

/** Returns null when no vault has been pushed to Drive yet. */
export async function pullVault(): Promise<RemoteVault | null> {
  const file = await findVaultFile();
  if (!file) return null;
  const sealed = await api<Sealed>(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`
  );
  return { fileId: file.id, sealed, modifiedTime: file.modifiedTime };
}

/** Creates or overwrites the vault file. The payload is already encrypted. */
export async function pushVault(sealed: Sealed): Promise<string> {
  if (!token) throw new Error("Not signed in to Google.");
  const existing = await findVaultFile();
  const boundary = `batch${Date.now()}`;
  const metadata = existing
    ? {}
    : { name: VAULT_FILENAME, mimeType: "application/json" };
  const body =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    "Content-Type: application/json\r\n\r\n" +
    `${JSON.stringify(sealed)}\r\n` +
    `--${boundary}--`;

  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart&fields=id`
    : "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id";

  const res = await fetch(url, {
    method: existing ? "PATCH" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) throw new Error(`Drive upload failed: ${await res.text()}`);
  const json = (await res.json()) as { id: string };
  return json.id;
}
