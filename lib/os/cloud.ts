/**
 * Cloud sync through Supabase.
 *
 * Only the sealed vault is stored — the same ciphertext that sits on this
 * device — so the row is unreadable without the passphrase even to anyone
 * holding the keys or the database itself. Access is additionally gated by
 * an account login and a row-level policy that limits every row to its
 * owner.
 *
 * The URL and publishable key below are public by design: they identify the
 * project and are meant to ship inside the client. What keeps other people
 * out is the login, the row-level policy, and sign-ups being closed.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Sealed } from "./crypto";

export const SUPABASE_URL = "https://xzsycsktkyoljbhftjqf.supabase.co";
export const SUPABASE_KEY = "sb_publishable_RNXvhxgWHPHIRckX_yOZJA_qKCoa2fI";

const TABLE = "vaults";

let client: SupabaseClient | null = null;

export function cloud(): SupabaseClient {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "batch-os-auth",
      },
    });
  }
  return client;
}

export interface Account {
  id: string;
  email: string;
}

export async function currentAccount(): Promise<Account | null> {
  const { data } = await cloud().auth.getSession();
  const user = data.session?.user;
  return user ? { id: user.id, email: user.email ?? "" } : null;
}

export async function signIn(email: string, password: string): Promise<Account> {
  const { data, error } = await cloud().auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(friendly(error.message));
  return { id: data.user!.id, email: data.user!.email ?? "" };
}

export async function signUp(email: string, password: string): Promise<Account | null> {
  const { data, error } = await cloud().auth.signUp({ email, password });
  if (error) throw new Error(friendly(error.message));
  /* With email confirmation on, there is no session until the link is used. */
  return data.session
    ? { id: data.user!.id, email: data.user!.email ?? "" }
    : null;
}

export async function signOut(): Promise<void> {
  await cloud().auth.signOut();
}

export interface RemoteVault {
  sealed: Sealed;
  updatedAt: number;
}

export async function fetchVault(): Promise<RemoteVault | null> {
  const { data, error } = await cloud()
    .from(TABLE)
    .select("sealed, updated_at")
    .maybeSingle();
  if (error) throw new Error(friendly(error.message));
  if (!data) return null;
  return { sealed: data.sealed as Sealed, updatedAt: Number(data.updated_at) };
}

export async function saveVault(
  userId: string,
  sealed: Sealed,
  updatedAt: number
): Promise<void> {
  const { error } = await cloud()
    .from(TABLE)
    .upsert(
      { user_id: userId, sealed, updated_at: updatedAt, modified: new Date().toISOString() },
      { onConflict: "user_id" }
    );
  if (error) throw new Error(friendly(error.message));
}

/** Turns Supabase's wording into something worth reading on screen. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login")) return "That email and password don't match.";
  if (m.includes("already registered")) return "That email already has an account — sign in instead.";
  if (m.includes("signups not allowed") || m.includes("sign ups"))
    return "New sign-ups are closed on this project.";
  if (m.includes("password") && m.includes("6"))
    return "Use a password of at least 6 characters.";
  if (m.includes("relation") && m.includes("does not exist"))
    return "The vaults table hasn't been created yet — run the setup SQL.";
  if (m.includes("row-level security") || m.includes("permission denied"))
    return "The database is refusing access — check the row-level policy.";
  if (m.includes("failed to fetch")) return "No connection to the cloud.";
  return message;
}
