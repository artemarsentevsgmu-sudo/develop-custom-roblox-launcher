"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight, Gamepad2, AlertTriangle, RefreshCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx, fmtCompact, fmtFull } from "@/lib/shared";
import { HexSpinner } from "@/components/icons";

/* ---------------- page motion wrapper ---------------- */

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------------- smart image ---------------- */

export function SmartImage({
  src,
  alt = "",
  className,
  eager,
}: {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  eager?: boolean;
}) {
  const [err, setErr] = useState(false);
  useEffect(() => setErr(false), [src]);
  if (!src || err) {
    return (
      <div
        className={cx(
          "grid place-items-center bg-gradient-to-br from-white/10 via-white/4 to-transparent",
          className
        )}
      >
        <Gamepad2 className="size-7 text-white/20" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      draggable={false}
      onError={() => setErr(true)}
      className={className}
    />
  );
}

/* ---------------- section header ---------------- */

export function SectionHeader({
  title,
  hint,
  href,
  className,
}: {
  title: string;
  hint?: string;
  href?: string;
  className?: string;
}) {
  return (
    <div className={cx("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="font-display text-xl font-bold tracking-tight md:text-2xl">{title}</h2>
        {hint && <p className="mt-1 text-sm text-white/45">{hint}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group flex shrink-0 items-center gap-1 text-sm font-medium text-white/50 transition hover:text-white"
        >
          Ещё
          <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </div>
  );
}

/* ---------------- count up ---------------- */

export function CountUp({
  value,
  compact = true,
  className,
}: {
  value: number;
  compact?: boolean;
  className?: string;
}) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number>(0);
  const shown = useRef(0);

  useEffect(() => {
    const from = shown.current;
    const to = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = Math.round(from + (to - from) * eased);
      setDisplay(v);
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else shown.current = to;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <span className={cx("tabular-nums", className)}>{compact ? fmtCompact(display) : fmtFull(display)}</span>;
}

/* ---------------- horizontal rail ---------------- */

export function Rail({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) =>
    ref.current?.scrollBy({ left: dir * (ref.current.clientWidth * 0.75), behavior: "smooth" });
  return (
    <div className="group/rail relative">
      <div
        ref={ref}
        className="no-scrollbar mask-fade-x flex gap-4 overflow-x-auto scroll-smooth pb-2"
      >
        {children}
      </div>
      <button
        onClick={() => scroll(-1)}
        className="glass-strong absolute top-[38%] -left-2 z-10 hidden size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full opacity-0 transition group-hover/rail:opacity-100 hover:scale-110 lg:grid"
        aria-label="Назад"
      >
        <ChevronLeft className="size-5" />
      </button>
      <button
        onClick={() => scroll(1)}
        className="glass-strong absolute top-[38%] -right-2 z-10 hidden size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full opacity-0 transition group-hover/rail:opacity-100 hover:scale-110 lg:grid"
        aria-label="Вперёд"
      >
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

/* ---------------- tabs ---------------- */

export function Tabs({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { key: string; label: string; icon?: LucideIcon }[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cx("chip no-scrollbar flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl p-1.5", className)}>
      {tabs.map((t) => {
        const active = t.key === value;
        const Icon = t.icon;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cx(
              "relative flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              active ? "text-white" : "text-white/50 hover:text-white/85"
            )}
          >
            {active && (
              <motion.span
                layoutId="tab-pill"
                className="chip-acc absolute inset-0 rounded-xl"
                transition={{ type: "spring", stiffness: 440, damping: 34 }}
              />
            )}
            {Icon && <Icon className="relative size-4" />}
            <span className="relative">{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- states ---------------- */

export function LoaderView({ label = "Загружаем метавселенную…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-24">
      <HexSpinner className="size-12" />
      <p className="text-sm text-white/40">{label}</p>
    </div>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="glass mx-auto my-16 flex max-w-md flex-col items-center gap-3 rounded-3xl p-8 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/15">
        <AlertTriangle className="size-6 text-amber-400" />
      </div>
      <p className="font-semibold">Не удалось получить данные</p>
      <p className="text-sm break-words text-white/45">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-ghost mt-2 flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
        >
          <RefreshCw className="size-4" /> Повторить
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  hint,
  action,
}: {
  icon: LucideIcon;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
      <div className="grid size-14 place-items-center rounded-2xl" style={{ background: "var(--acc-soft)" }}>
        <Icon className="size-7" style={{ color: "var(--acc2)" }} />
      </div>
      <p className="text-lg font-bold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-white/45">{hint}</p>}
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx("skeleton rounded-2xl", className)} />;
}
