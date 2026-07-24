import type { CSSProperties } from "react";

/**
 * Display headline revealed word by word — each word rises out of an
 * overflow-hidden slot with a 55ms stagger once the heading scrolls in.
 */
export default function SplitHeading({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  const words = text.trim().split(/\s+/);
  return (
    <h2 className={`display split ${className}`.trim()}>
      {words.map((word, i) => (
        <span key={i}>
          <span className="w">
            <span style={{ "--i": i } as CSSProperties}>{word}</span>
          </span>
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </h2>
  );
}
