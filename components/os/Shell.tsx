"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Boxes,
  CalendarDays,
  ChefHat,
  FileLock2,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Sun,
  Wallet,
  X,
} from "lucide-react";
import { asset } from "@/lib/site";
import { useVault } from "./VaultProvider";
import { Modal } from "./ui";

import Dashboard from "./modules/Dashboard";
import Recipes from "./modules/Recipes";
import Inventory from "./modules/Inventory";
import Production from "./modules/Production";
import Sales from "./modules/Sales";
import Finance from "./modules/Finance";
import Planner from "./modules/Planner";
import Documents from "./modules/Documents";
import SettingsModule from "./modules/SettingsModule";

export type ModuleKey =
  | "dashboard"
  | "recipes"
  | "inventory"
  | "production"
  | "sales"
  | "finance"
  | "planner"
  | "documents"
  | "settings";

const NAV: { key: ModuleKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "recipes", label: "Recipes & R&D", icon: ChefHat },
  { key: "inventory", label: "Inventory", icon: Boxes },
  { key: "production", label: "Production", icon: BookOpen },
  { key: "sales", label: "Sales", icon: ShoppingBag },
  { key: "finance", label: "Finance", icon: Wallet },
  { key: "planner", label: "Planner", icon: CalendarDays },
  { key: "documents", label: "Documents", icon: FileLock2 },
];

const TITLES: Record<ModuleKey, string> = {
  dashboard: "Dashboard",
  recipes: "Recipes & R&D",
  inventory: "Inventory",
  production: "Production",
  sales: "Sales",
  finance: "Finance",
  planner: "Planner",
  documents: "Business documents",
  settings: "Settings",
};

export default function Shell() {
  const { vault, update, saving } = useVault();
  const [module, setModule] = useState<ModuleKey>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const theme = vault?.settings.theme ?? "system";

  /* Theme is applied to the document so the lock screen and app agree. */
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && mq.matches);
      document.documentElement.dataset.osTheme = dark ? "dark" : "light";
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* Global search across every collection that has a name worth finding. */
  const results = useMemo(() => {
    if (!vault || query.trim().length < 2) return [];
    const q = query.toLowerCase();
    const hits: { label: string; where: string; go: ModuleKey }[] = [];
    const add = (label: string, where: string, go: ModuleKey) => {
      if (hits.length < 24 && label.toLowerCase().includes(q))
        hits.push({ label, where, go });
    };
    vault.recipes.forEach((r) => add(`${r.name} · v${r.version}`, "Recipe", "recipes"));
    vault.inventory.forEach((i) => add(i.name, "Inventory", "inventory"));
    vault.customers.forEach((c) => add(c.name, "Customer", "sales"));
    vault.suppliers.forEach((s) => add(s.name, "Supplier", "inventory"));
    vault.equipment.forEach((e) => add(e.name, "Equipment", "finance"));
    vault.expenses.forEach((e) => add(e.description, "Expense", "finance"));
    vault.plan.forEach((p) => add(p.title, "Plan", "planner"));
    vault.docs.forEach((d) => add(d.title, "Document", "documents"));
    return hits;
  }, [vault, query]);

  if (!vault) return null;

  const Current = {
    dashboard: Dashboard,
    recipes: Recipes,
    inventory: Inventory,
    production: Production,
    sales: Sales,
    finance: Finance,
    planner: Planner,
    documents: Documents,
    settings: SettingsModule,
  }[module];

  const dark = document.documentElement.dataset.osTheme === "dark";

  return (
    <div className="os-shell">
      {menuOpen && <div className="os-scrim" onClick={() => setMenuOpen(false)} />}
      <aside className={`os-side${menuOpen ? " is-open" : ""}`}>
        <div className="os-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset("/assets/batch-logo-black.png")} alt="Batch." />
          <span>OS</span>
        </div>
        {NAV.map((n) => (
          <button
            key={n.key}
            className="os-nav-item"
            aria-current={module === n.key}
            onClick={() => {
              setModule(n.key);
              setMenuOpen(false);
            }}
          >
            <n.icon />
            {n.label}
          </button>
        ))}
        <div className="os-nav-sep" />
        <button
          className="os-nav-item"
          aria-current={module === "settings"}
          onClick={() => {
            setModule("settings");
            setMenuOpen(false);
          }}
        >
          <SettingsIcon />
          Settings
        </button>
        <button
          className="os-nav-item"
          onClick={() =>
            update((d) => {
              d.settings.theme = dark ? "light" : "dark";
            })
          }
        >
          {dark ? <Sun /> : <Moon />}
          {dark ? "Light mode" : "Dark mode"}
        </button>
      </aside>

      <div className="os-main">
        <header className="os-top">
          <button
            className="os-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <h1>{TITLES[module]}</h1>
          <button className="os-search" onClick={() => setSearchOpen(true)}>
            <Search />
            <input
              readOnly
              placeholder="Search everything…"
              style={{ cursor: "pointer" }}
            />
          </button>
          <span className="os-small os-muted" aria-live="polite">
            {saving ? "Saving…" : "Saved"}
          </span>
        </header>
        <main className="os-content">
          <Current onNavigate={setModule} />
        </main>
      </div>

      {searchOpen && (
        <Modal title="Search" onClose={() => setSearchOpen(false)}>
          <div className="os-search" style={{ flex: 1, marginBottom: 14 }}>
            <Search />
            <input
              autoFocus
              value={query}
              placeholder="Recipes, stock, customers, expenses, plans…"
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button className="os-x" onClick={() => setQuery("")} aria-label="Clear">
                <X size={15} />
              </button>
            )}
          </div>
          <div className="os-results">
            {results.map((r, i) => (
              <button
                key={`${r.label}-${i}`}
                className="os-result"
                onClick={() => {
                  setModule(r.go);
                  setSearchOpen(false);
                  setQuery("");
                }}
              >
                <span>{r.label}</span>
                <span className="os-chip os-right">{r.where}</span>
              </button>
            ))}
            {query.trim().length >= 2 && !results.length && (
              <p className="os-muted os-small">No matches.</p>
            )}
            {query.trim().length < 2 && (
              <p className="os-muted os-small">
                Type at least two characters. Press ⌘K / Ctrl-K to open this from
                anywhere.
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export interface ModuleProps {
  onNavigate: (m: ModuleKey) => void;
}
