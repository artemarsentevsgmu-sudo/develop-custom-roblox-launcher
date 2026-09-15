import type { CSSProperties } from "react";
import { cx } from "@/lib/shared";

/* Vector recreations of the official Robux / Premium glyphs — crisp at any size,
 * tinted via currentColor (unlike tiny hotlinked .ico files). */

interface IconProps {
  className?: string;
  style?: CSSProperties;
}

export function RobuxIcon({ className, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("inline-block shrink-0", className)}
      style={style}
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M12.9 1.6 19.4 5.4a2.3 2.3 0 0 1 1.15 2v7.9a2.3 2.3 0 0 1-1.15 2l-6.5 3.74a2.32 2.32 0 0 1-2.3 0L4.1 17.3a2.3 2.3 0 0 1-1.15-2V7.4a2.3 2.3 0 0 1 1.15-2l6.5-3.8a2.32 2.32 0 0 1 2.3 0Zm-1.1 8.2a.5.5 0 0 0-.5.5v3.4a.5.5 0 0 0 .5.5h2.2a.5.5 0 0 0 .5-.5v-3.4a.5.5 0 0 0-.5-.5h-2.2Z"
        clipRule="evenodd"
        transform="rotate(-9 12 12)"
      />
    </svg>
  );
}

export function PremiumIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cx("inline-block shrink-0", className)}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 1.8 14.9 8 21.6 8.9 16.6 13.5 17.9 20.2 12 16.9 6.1 20.2 7.4 13.5 2.4 8.9 9.1 8 12 1.8Z" />
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="rlg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--acc1)" />
          <stop offset="55%" stopColor="var(--acc2)" />
          <stop offset="100%" stopColor="var(--acc3)" />
        </linearGradient>
      </defs>
      <rect
        x="4.5"
        y="4.5"
        width="23"
        height="23"
        rx="7"
        fill="url(#rlg)"
        transform="rotate(-8 16 16)"
      />
      <rect
        x="11.6"
        y="11.6"
        width="8.8"
        height="8.8"
        rx="2.4"
        fill="#07070d"
        transform="rotate(-8 16 16)"
      />
      <circle cx="23.4" cy="8.6" r="2.1" fill="#fff" opacity="0.9" />
    </svg>
  );
}

export function HexSpinner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <polygon
        points="20,3 34.8,11.5 34.8,28.5 20,37 5.2,28.5 5.2,11.5"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="2.5"
      />
      <polygon
        points="20,3 34.8,11.5 34.8,28.5 20,37 5.2,28.5 5.2,11.5"
        fill="none"
        stroke="url(#rlg)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="16 90"
        style={{ animation: "spin-slow 1.2s linear infinite", transformOrigin: "center" }}
      />
    </svg>
  );
}
