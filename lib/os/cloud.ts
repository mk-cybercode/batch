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

/** The one-time setup, shown in the app so it can be copied straight into the
 *  Supabase SQL editor. Kept in step with supabase/setup.sql. */
export const SETUP_SQL = `create table if not exists public.vaults (
  user_id    uuid primary key references auth.users on delete cascade,
  sealed     jsonb not null,
  updated_at bigint not null,
  modified   timestamptz not null default now()
);

alter table public.vaults enable row level security;

grant select, insert, update on public.vaults to authenticated;

drop policy if exists "own vault read"   on public.vaults;
drop policy if exists "own vault insert" on public.vaults;
drop policy if exists "own vault update" on public.vaults;

create policy "own vault read"
  on public.vaults for select
  to authenticated
  using (auth.uid() = user_id);

create policy "own vault insert"
  on public.vaults for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "own vault update"
  on public.vaults for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);`;

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
  const { data, error } = await reachable(() =>
    cloud().auth.signInWithPassword({ email, password })
  );
  if (error) throw new Error(friendly(error.message));
  return { id: data.user!.id, email: data.user!.email ?? "" };
}

/**
 * Runs a call that may not reach Supabase at all.
 *
 * A paused project rejects the connection, and the client raises that rather
 * than returning it, so without this the screen shows a raw fetch error where
 * it should be naming the cause.
 */
async function reachable<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    throw new Error(friendly(e instanceof Error ? e.message : String(e)));
  }
}

export async function signUp(email: string, password: string): Promise<Account | null> {
  const { data, error } = await reachable(() =>
    cloud().auth.signUp({
      email,
      password,
      /* Without this, a confirmation email points at whatever Site URL the
         project was created with — by default http://localhost:3000, which is
         a development address that exists on nobody's phone. Send people back
         to the page they signed up on instead. */
      options: { emailRedirectTo: appUrl() },
    })
  );
  if (error) throw new Error(friendly(error.message));
  /* With email confirmation on, there is no session until the link is used. */
  return data.session
    ? { id: data.user!.id, email: data.user!.email ?? "" }
    : null;
}

/** The address of this copy of the app, for confirmation links to return to. */
function appUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.origin + window.location.pathname;
}

/** Sends a fresh confirmation email when the first link went stale. */
export async function resendConfirmation(email: string): Promise<void> {
  const { error } = await cloud().auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: appUrl() },
  });
  if (error) throw new Error(friendly(error.message));
}

export async function signOut(): Promise<void> {
  await cloud().auth.signOut();
}

export interface RemoteVault {
  sealed: Sealed;
  updatedAt: number;
}

export async function fetchVault(userId: string): Promise<RemoteVault | null> {
  const { data, error } = await reachable(
    async () =>
      await cloud()
        .from(TABLE)
        .select("sealed, updated_at")
        .eq("user_id", userId)
        .maybeSingle()
  );
  if (error) throw new Error(friendly(error.message));
  if (!data) return null;
  return { sealed: data.sealed as Sealed, updatedAt: Number(data.updated_at) };
}

export async function saveVault(
  userId: string,
  sealed: Sealed,
  updatedAt: number
): Promise<void> {
  const { error } = await reachable(
    async () =>
      await cloud()
        .from(TABLE)
        .upsert(
          { user_id: userId, sealed, updated_at: updatedAt, modified: new Date().toISOString() },
          { onConflict: "user_id" }
        )
  );
  if (error) throw new Error(friendly(error.message));
}

/** Raised whenever the table or its policies are missing, so the settings
 *  screen knows to put the setup SQL on screen instead of a bare complaint. */
export const NEEDS_SETUP =
  "The cloud isn't set up yet — the vaults table and its access rules are missing.";

/**
 * Raised when the project itself is asleep. Supabase pauses a free project
 * after about a week without use, and every call then fails at the network
 * before it ever reaches a table — which reads exactly like being offline
 * unless it is called by name.
 */
export const PROJECT_PAUSED =
  "The Supabase project is paused or unreachable. Nothing is lost — your data is on this device.";

/** Turns Supabase's wording into something worth reading on screen. */
function friendly(message: string): string {
  const m = message.toLowerCase();
  if (
    m.includes("paused") ||
    m.includes("project is not active") ||
    m.includes("503") ||
    m.includes("540") ||
    m.includes("service unavailable")
  )
    return PROJECT_PAUSED;
  if (m.includes("invalid login"))
    return "No account with that email and password. If you haven't made one yet, use “First time here”.";
  if (m.includes("already registered")) return "That email already has an account — sign in instead.";
  if (m.includes("not confirmed"))
    return "That account still needs its email confirmed — open the link we sent, or use “Send the link again”.";
  if (m.includes("expired") || m.includes("otp"))
    return "That confirmation link has expired — use “Send the link again”.";
  if (m.includes("signups not allowed") || m.includes("sign ups"))
    return "New sign-ups are closed on this project.";
  if (m.includes("password") && m.includes("6"))
    return "Use a password of at least 6 characters.";
  if (
    (m.includes("relation") && m.includes("does not exist")) ||
    m.includes("could not find the table") ||
    m.includes("schema cache")
  )
    return NEEDS_SETUP;
  if (
    m.includes("row-level security") ||
    m.includes("permission denied") ||
    m.includes("violates row-level")
  )
    return NEEDS_SETUP;
  /* A paused project refuses the connection outright, so this is the shape
     the failure usually arrives in. Both causes get named. */
  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("load failed")
  )
    return PROJECT_PAUSED;
  return message;
}
