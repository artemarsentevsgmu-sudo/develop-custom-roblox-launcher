"use client";

import { useId, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { cx, fmtCompact } from "@/lib/shared";

/* ---------------- area / line chart ---------------- */

export interface Pt {
  label: string;
  value: number;
  secondary?: number;
}

export function AreaChart({
  data,
  height = 240,
  valueLabel = "R$",
  showSecondary,
}: {
  data: Pt[];
  height?: number;
  valueLabel?: string;
  showSecondary?: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const [hover, setHover] = useState<number | null>(null);
  const W = 1000;
  const H = height;
  const pad = { t: 18, r: 12, b: 26, l: 46 };

  const { path, area, pts, max, ticks, path2 } = useMemo(() => {
    const vals = data.map((d) => d.value);
    const vals2 = data.map((d) => d.secondary ?? 0);
    const maxV = Math.max(1, ...vals, ...(showSecondary ? vals2 : []));
    const niceMax = Math.ceil(maxV / 5) * 5 || 5;
    const iw = W - pad.l - pad.r;
    const ih = H - pad.t - pad.b;
    const x = (i: number) => pad.l + (data.length <= 1 ? iw / 2 : (i / (data.length - 1)) * iw);
    const y = (v: number) => pad.t + ih - (v / niceMax) * ih;

    const build = (arr: number[]) => {
      if (!arr.length) return "";
      // smooth cubic through points
      let d = `M ${x(0)} ${y(arr[0])}`;
      for (let i = 1; i < arr.length; i++) {
        const cx1 = x(i - 1) + (x(i) - x(i - 1)) / 2;
        d += ` C ${cx1} ${y(arr[i - 1])}, ${cx1} ${y(arr[i])}, ${x(i)} ${y(arr[i])}`;
      }
      return d;
    };
    const p = build(vals);
    const p2 = showSecondary ? build(vals2) : "";
    const a = p ? `${p} L ${x(vals.length - 1)} ${pad.t + ih} L ${x(0)} ${pad.t + ih} Z` : "";
    return {
      path: p,
      path2: p2,
      area: a,
      max: niceMax,
      pts: data.map((d, i) => ({ ...d, x: x(i), y: y(d.value) })),
      ticks: Array.from({ length: 5 }, (_, i) => {
        const v = (niceMax / 4) * i;
        return { v, y: y(v) };
      }),
    };
  }, [data, H, showSecondary]);

  if (!data.length) {
    return <div className="grid h-60 place-items-center text-sm text-white/40">Нет данных за период</div>;
  }
  const active = hover != null ? pts[hover] : null;
  const step = Math.max(1, Math.ceil(pts.length / 8));

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--acc1)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--acc1)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--acc1)" />
            <stop offset="100%" stopColor="var(--acc2)" />
          </linearGradient>
        </defs>

        {ticks.map((t) => (
          <g key={t.v}>
            <line x1={46} y1={t.y} x2={W - 12} y2={t.y} stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
            <text x={40} y={t.y + 4} textAnchor="end" fontSize="13" fill="rgba(255,255,255,0.35)">
              {fmtCompact(t.v)}
            </text>
          </g>
        ))}

        <motion.path
          d={area}
          fill={`url(#fill-${uid})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        {showSecondary && path2 && (
          <path d={path2} fill="none" stroke="var(--acc3)" strokeWidth="2" strokeDasharray="6 6" opacity="0.7" />
        )}
        <motion.path
          d={path}
          fill="none"
          stroke={`url(#stroke-${uid})`}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />

        {active && (
          <g>
            <line x1={active.x} y1={pad.t} x2={active.x} y2={H - pad.b} stroke="rgba(255,255,255,0.25)" strokeDasharray="4 4" />
            <circle cx={active.x} cy={active.y} r="7" fill="var(--acc2)" stroke="#07070d" strokeWidth="3" />
          </g>
        )}

        {pts.map((p, i) =>
          i % step === 0 ? (
            <text key={p.label + i} x={p.x} y={H - 6} textAnchor="middle" fontSize="13" fill="rgba(255,255,255,0.35)">
              {p.label}
            </text>
          ) : null
        )}

        {pts.map((p, i) => (
          <rect
            key={`h${i}`}
            x={p.x - (W / pts.length) / 2}
            y={0}
            width={W / pts.length}
            height={H}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </svg>

      {active && (
        <div
          className="glass-strong pointer-events-none absolute z-10 rounded-xl px-3 py-2 text-xs shadow-xl"
          style={{
            left: `calc(${(active.x / W) * 100}% )`,
            top: 6,
            transform: "translateX(-50%)",
          }}
        >
          <p className="font-semibold">{active.label}</p>
          <p className="mt-0.5 font-bold" style={{ color: "var(--acc2)" }}>
            {fmtCompact(active.value)} {valueLabel}
          </p>
          {showSecondary && active.secondary != null && (
            <p className="text-white/50">{fmtCompact(active.secondary)} шт.</p>
          )}
        </div>
      )}
      <span className="sr-only">Максимум {max}</span>
    </div>
  );
}

/* ---------------- bar chart ---------------- */

export function BarChart({ data, height = 200 }: { data: Pt[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label + i} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
          <span className="pointer-events-none absolute -top-7 z-10 rounded-lg bg-black/80 px-2 py-1 text-[10px] font-semibold opacity-0 transition group-hover:opacity-100">
            {fmtCompact(d.value)}
          </span>
          <motion.div
            className="w-full rounded-t-lg"
            style={{ background: "linear-gradient(180deg, var(--acc2), var(--acc1))", minHeight: 3 }}
            initial={{ height: 0 }}
            animate={{ height: `${(d.value / max) * 100}%` }}
            transition={{ delay: i * 0.02, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          />
          <span className="truncate text-[9px] text-white/35">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- sparkline ---------------- */

export function Spark({ values, className }: { values: number[]; className?: string }) {
  if (!values.length) return <div className={cx("h-8", className)} />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const d = values
    .map((v, i) => {
      const x = (i / Math.max(values.length - 1, 1)) * 100;
      const y = 28 - ((v - min) / span) * 26;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
  const up = values[values.length - 1] >= values[0];
  return (
    <svg viewBox="0 0 100 30" className={cx("h-8 w-24", className)} preserveAspectRatio="none">
      <path d={d} fill="none" stroke={up ? "#34d399" : "#fb7185"} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/* ---------------- donut ---------------- */

export function Donut({
  slices,
  size = 180,
}: {
  slices: { label: string; value: number }[];
  size?: number;
}) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  const palette = ["var(--acc1)", "var(--acc2)", "var(--acc3)", "#34d399", "#fbbf24", "#fb7185", "#818cf8"];
  const r = 52;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 140 140" style={{ width: size, height: size }} className="shrink-0 -rotate-90">
        {slices.map((s, i) => {
          const frac = s.value / total;
          const dash = frac * c;
          const el = (
            <motion.circle
              key={s.label}
              cx="70"
              cy="70"
              r={r}
              fill="none"
              stroke={palette[i % palette.length]}
              strokeWidth="18"
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.08 }}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <div className="min-w-0 flex-1 space-y-2">
        {slices.slice(0, 7).map((s, i) => (
          <div key={s.label} className="flex items-center gap-2.5 text-sm">
            <span className="size-3 shrink-0 rounded-full" style={{ background: palette[i % palette.length] }} />
            <span className="min-w-0 flex-1 truncate text-white/70">{s.label}</span>
            <span className="font-semibold">{fmtCompact(s.value)}</span>
            <span className="w-11 text-right text-xs text-white/40">
              {((s.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
