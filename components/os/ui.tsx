"use client";

import { X } from "lucide-react";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import { ZAR } from "@/lib/os/format";

export function Card({
  children,
  pad,
  style,
}: {
  children: ReactNode;
  pad?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div className={`os-card${pad ? " os-card--pad" : ""}`} style={style}>
      {children}
    </div>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone,
  delay = 0,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "pos" | "neg";
  delay?: number;
}) {
  return (
    <Card>
      <div className="os-stat" style={{ animationDelay: `${delay}ms` }}>
        <div className="os-stat-label">{label}</div>
        <div
          className={`os-stat-value${tone ? (tone === "pos" ? " os-pos" : " os-neg") : ""}`}
        >
          {value}
        </div>
        {sub && <div className="os-stat-sub">{sub}</div>}
      </div>
    </Card>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <div className="os-section-title">{children}</div>;
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="os-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  /* Escape closes the topmost dialog — stopPropagation keeps a nested one
     from closing its parent at the same time. */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="os-modal-scrim"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="os-modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="os-modal-head">
          <h2>{title}</h2>
          <button className="os-x" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        {children}
        {footer && (
          <div className="os-flex" style={{ marginTop: 20, justifyContent: "flex-end" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="os-empty">
      <h3>{title}</h3>
      <p>{body}</p>
      {action}
    </div>
  );
}

/** Horizontal bar chart — used for channels, expenses and margins. */
export function Bars({
  rows,
  format = (n: number) => ZAR(n),
}: {
  rows: { label: string; value: number; tone?: string }[];
  format?: (n: number) => string;
}) {
  const max = Math.max(...rows.map((r) => Math.abs(r.value)), 1);
  return (
    <div className="os-bars">
      {rows.map((r, i) => (
        <div className="os-bar-row" key={r.label}>
          <span className="os-small">{r.label}</span>
          <span className="os-bar-track">
            <span
              className="os-bar-fill"
              style={{
                width: `${(Math.abs(r.value) / max) * 100}%`,
                background: r.tone,
                animationDelay: `${i * 60}ms`,
              }}
            />
          </span>
          <span className="os-bar-value os-small">{format(r.value)}</span>
        </div>
      ))}
    </div>
  );
}

/** Inline SVG line chart — no external libraries, so it works under a strict CSP. */
export function Spark({
  points,
  labels,
}: {
  points: number[];
  labels?: string[];
}) {
  if (!points.length) return null;
  const w = 300;
  const h = 72;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const step = points.length > 1 ? w / (points.length - 1) : w;
  const coords = points.map((p, i) => [
    i * step,
    h - ((p - min) / range) * (h - 10) - 5,
  ]);
  const line = coords.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;
  return (
    <svg className="os-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img">
      <path d={area} fill="var(--os-accent-soft)" opacity="0.5" />
      <path
        d={line}
        fill="none"
        stroke="var(--os-accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {labels && <title>{labels.join(", ")}</title>}
    </svg>
  );
}

export function Chip({
  children,
  tone,
}: {
  children: ReactNode;
  tone?: "accent" | "caramel" | "danger";
}) {
  return <span className={`os-chip${tone ? ` os-chip--${tone}` : ""}`}>{children}</span>;
}
