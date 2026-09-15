"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Users,
  Heart,
  ThumbsUp,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  Server,
  Gauge,
  Globe2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cx, fmtCompact, fmtFull, type GameDetail, type GameServer, type GameSummary } from "@/lib/shared";
import { CountUp, SmartImage } from "@/components/ui";
import { useLauncher } from "@/components/launcher";
import { useStore } from "@/components/store";
import { RobuxIcon } from "@/components/icons";

/* ---------------- play buttons ---------------- */

export function PlayCTA({
  game,
  label = "Играть",
  className,
}: {
  game: Pick<GameSummary, "placeId" | "universeId" | "name" | "iconUrl">;
  label?: string;
  className?: string;
}) {
  const { play } = useLauncher();
  return (
    <button
      onClick={() => play(game)}
      className={cx(
        "btn-acc shine flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl px-7 py-3.5 text-base font-bold",
        className
      )}
    >
      <Play className="size-5 fill-current" />
      {label}
    </button>
  );
}

export function PlayFab({
  game,
  className,
}: {
  game: Pick<GameSummary, "placeId" | "universeId" | "name" | "iconUrl">;
  className?: string;
}) {
  const { play } = useLauncher();
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        play(game);
      }}
      aria-label={`Играть в ${game.name}`}
      className={cx(
        "btn-acc grid size-11 cursor-pointer place-items-center rounded-full",
        className
      )}
    >
      <Play className="size-4.5 fill-current" />
    </button>
  );
}

/* ---------------- game card ---------------- */

export function GameCard({ game, className }: { game: GameSummary; className?: string }) {
  const { toggleFavorite, isFavorite } = useStore();
  const fav = isFavorite(game.universeId);
  return (
    <Link
      href={`/game/${game.universeId}`}
      className={cx(
        "card-hover shine group relative block w-40 shrink-0 overflow-hidden rounded-[22px] border border-white/8 bg-white/4 sm:w-44",
        className
      )}
    >
      <div className="relative aspect-square overflow-hidden">
        <SmartImage
          src={game.iconUrl}
          alt={game.name}
          className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-80" />
        {game.playing > 0 && (
          <span className="chip absolute top-2 left-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-semibold">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
            {fmtCompact(game.playing)}
          </span>
        )}
        {game.price ? (
          <span className="chip absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/40 px-2 py-1 text-[10px] font-semibold text-amber-300">
            <RobuxIcon className="size-3" />
            {fmtCompact(game.price)}
          </span>
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(game);
            }}
            aria-label="В библиотеку"
            className={cx(
              "absolute top-2 right-2 grid size-7 cursor-pointer place-items-center rounded-full backdrop-blur-md transition-all",
              fav
                ? "scale-100 bg-rose-500/90 text-white"
                : "bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:scale-110 hover:text-white"
            )}
          >
            <Heart className={cx("size-3.5", fav && "fill-current")} />
          </button>
        )}
        <div className="absolute right-2 bottom-2 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <PlayFab game={game} className="size-9" />
        </div>
      </div>
      <div className="p-3">
        <p className="truncate text-sm leading-snug font-semibold">{game.name}</p>
        <p className="mt-0.5 truncate text-xs text-white/40">{game.creatorName}</p>
        <div className="mt-2 flex items-center gap-2.5 text-[11px] text-white/55">
          {game.rating != null && (
            <span className="flex items-center gap-1 text-emerald-300/90">
              <ThumbsUp className="size-3" />
              {game.rating}%
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="size-3" />
            {fmtCompact(game.playing)}
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ---------------- hero carousel ---------------- */

export function HeroCarousel({ games }: { games: GameSummary[] }) {
  const [index, setIndex] = useState(0);
  const count = games.length;
  const game = games[index % Math.max(count, 1)];

  useEffect(() => {
    if (count < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), 6500);
    return () => clearInterval(t);
  }, [count]);

  if (!game) return null;
  const art = game.mediaUrl || game.iconUrl;

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10">
      {/* backdrop */}
      <div className="absolute inset-0">
        <AnimatePresence mode="sync">
          <motion.div
            key={game.universeId}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
          >
            <SmartImage
              src={art}
              alt=""
              className="anim-kenburns size-full scale-110 object-cover opacity-35 blur-2xl"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#07070d] via-[#07070d]/70 to-[#07070d]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07070d] via-transparent to-transparent" />
      </div>

      <div className="relative grid gap-8 p-6 md:p-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`l-${game.universeId}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0"
          >
            <p className="font-display mb-4 flex items-center gap-2 text-[11px] tracking-[0.3em] text-white/50 uppercase">
              <span className="size-1.5 rounded-full" style={{ background: "var(--acc2)" }} />
              Витрина метавселенной · #{index + 1}
            </p>
            <Link href={`/game/${game.universeId}`}>
              <h1 className="font-display line-clamp-2 text-3xl leading-[1.05] font-bold tracking-tight hover:underline decoration-white/30 underline-offset-8 sm:text-4xl xl:text-5xl">
                {game.name}
              </h1>
            </Link>
            <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-white/60">
              {game.creatorVerified && <BadgeCheck className="size-4 text-sky-400" />}
              <span className="font-medium text-white/80">{game.creatorName}</span>
              {game.genre && <span className="chip rounded-full px-2.5 py-0.5 text-xs">{game.genre}</span>}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <span className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5">
                <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                <strong className="font-bold">
                  <CountUp value={game.playing} />
                </strong>
                <span className="text-white/55">играют</span>
              </span>
              <span className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5">
                <Heart className="size-4 text-rose-400" />
                <strong className="font-bold">{fmtCompact(game.favorites)}</strong>
                <span className="text-white/55">в избранном</span>
              </span>
              {game.rating != null && (
                <span className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5">
                  <ThumbsUp className="size-4 text-emerald-400" />
                  <strong className="font-bold">{game.rating}%</strong>
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <PlayCTA game={game} label="Играть сейчас" />
              <Link
                href={`/game/${game.universeId}`}
                className="btn-ghost cursor-pointer rounded-2xl px-7 py-3.5 text-base font-semibold"
              >
                Подробнее
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* artwork */}
        <div className="relative hidden justify-center lg:flex">
          <AnimatePresence mode="wait">
            <motion.div
              key={`a-${game.universeId}`}
              initial={{ opacity: 0, scale: 0.94, rotate: 1.5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[560px]"
            >
              <Link href={`/game/${game.universeId}`} className="block">
                <div className="card-hover shine overflow-hidden rounded-[26px] border border-white/15 shadow-2xl shadow-black/60">
                  <SmartImage src={art} alt={game.name} className="aspect-video w-full object-cover" eager />
                </div>
              </Link>
              <motion.div
                className="glass-strong anim-floaty absolute -bottom-5 -left-6 flex items-center gap-3 rounded-2xl p-3 shadow-xl shadow-black/50"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <SmartImage src={game.iconUrl} alt="" className="size-12 rounded-xl object-cover" />
                <div className="pr-2">
                  <p className="max-w-40 truncate text-sm font-bold">{game.name}</p>
                  <p className="text-xs text-white/50">{fmtCompact(game.visits)} визитов</p>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* controls */}
      <div className="relative flex items-center justify-between px-6 pb-6 md:px-10">
        <div className="flex gap-1.5">
          {games.map((g, i) => (
            <button
              key={g.universeId}
              onClick={() => setIndex(i)}
              aria-label={`Слайд ${i + 1}`}
              className="group cursor-pointer py-1"
            >
              <span
                className={cx(
                  "block h-1.5 rounded-full transition-all duration-500",
                  i === index ? "w-8" : "w-2.5 bg-white/20 group-hover:bg-white/45"
                )}
                style={i === index ? { background: "linear-gradient(90deg, var(--acc1), var(--acc2))" } : undefined}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIndex((i) => (i - 1 + count) % count)}
            className="btn-ghost grid size-9 cursor-pointer place-items-center rounded-full"
            aria-label="Предыдущий"
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            onClick={() => setIndex((i) => (i + 1) % count)}
            className="btn-ghost grid size-9 cursor-pointer place-items-center rounded-full"
            aria-label="Следующий"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ---------------- detail widgets ---------------- */

export function StatItem({
  icon: Icon,
  label,
  value,
  numeric,
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  numeric?: boolean;
}) {
  return (
    <div className="glass card-hover rounded-2xl p-4">
      <div className="flex items-center gap-2 text-white/45">
        <Icon className="size-4" />
        <p className="text-xs tracking-wider uppercase">{label}</p>
      </div>
      <p className="font-display mt-2 text-xl font-bold">
        {typeof value === "number" ? <CountUp value={value} compact={numeric !== false} /> : value}
      </p>
    </div>
  );
}

export function RatingBar({ up, down }: { up: number; down: number }) {
  const total = up + down;
  const p = total ? Math.round((up / total) * 100) : null;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-emerald-300">
          <ThumbsUp className="size-4" /> {total ? `${p}%` : "—"}
        </span>
        <span className="text-xs text-white/40">{fmtCompact(total)} оценок</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="rating-strip h-full rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${p ?? 0}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </div>
    </div>
  );
}

export function MediaGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  if (!images.length) return null;
  const current = images[Math.min(active, images.length - 1)];
  return (
    <div>
      <button
        onClick={() => setZoom(true)}
        className="group shine relative block w-full cursor-zoom-in overflow-hidden rounded-[24px] border border-white/10"
      >
        <SmartImage src={current} alt={name} className="aspect-video w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" eager />
        <span className="chip absolute right-3 bottom-3 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 text-xs opacity-0 transition group-hover:opacity-100">
          <Expand className="size-3" /> Увеличить
        </span>
      </button>
      <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto pb-1">
        {images.map((img, i) => (
          <button
            key={img + i}
            onClick={() => setActive(i)}
            className={cx(
              "relative shrink-0 cursor-pointer overflow-hidden rounded-xl border transition-all duration-300",
              i === active ? "border-transparent opacity-100 ring-2 ring-(--acc1)" : "border-white/10 opacity-55 hover:opacity-100"
            )}
          >
            <SmartImage src={img} alt="" className="h-16 w-28 object-cover" />
          </button>
        ))}
      </div>

      <AnimatePresence>
        {zoom && (
          <motion.div
            className="fixed inset-0 z-[80] grid cursor-zoom-out place-items-center bg-black/88 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setZoom(false)}
          >
            <motion.div
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
              className="relative max-w-5xl"
            >
              <SmartImage src={current} alt={name} className="w-full rounded-3xl" eager />
              <span className="chip absolute top-3 right-3 grid size-9 place-items-center rounded-full bg-black/50">
                <X className="size-4" />
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ServerTable({ game, servers }: { game: GameDetail; servers: GameServer[] }) {
  const { play } = useLauncher();
  if (!servers.length)
    return (
      <div className="glass rounded-3xl p-8 text-center text-sm text-white/45">
        <Server className="mx-auto mb-3 size-8 text-white/25" />
        Публичные серверы сейчас недоступны
      </div>
    );
  return (
    <div className="glass overflow-hidden rounded-3xl">
      <div className="hidden grid-cols-[1fr_90px_90px_90px_120px] gap-3 border-b border-white/8 px-5 py-3 text-[11px] tracking-wider text-white/40 uppercase md:grid">
        <span>Сервер</span>
        <span className="text-center">Игроки</span>
        <span className="text-center">FPS</span>
        <span className="text-center">Пинг</span>
        <span />
      </div>
      <div className="divide-y divide-white/6">
        {servers.map((s) => {
          const fill = s.maxPlayers ? Math.round((s.playing / s.maxPlayers) * 100) : 0;
          return (
            <div
              key={s.id}
              className="grid grid-cols-2 items-center gap-3 px-5 py-3.5 transition hover:bg-white/4 md:grid-cols-[1fr_90px_90px_90px_120px]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  <Globe2 className="mr-1.5 inline size-3.5 text-white/40" />
                  {s.id.slice(0, 12)}…
                </p>
                <div className="mt-1.5 h-1 w-36 overflow-hidden rounded-full bg-white/8 md:w-48">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${fill}%`,
                      background: fill > 85 ? "#fb7185" : "linear-gradient(90deg,var(--acc1),var(--acc2))",
                    }}
                  />
                </div>
              </div>
              <p className="text-center text-sm">
                <strong>{s.playing}</strong>
                <span className="text-white/40">/{s.maxPlayers}</span>
              </p>
              <p className="hidden text-center text-sm text-white/60 md:block">
                <Gauge className="mr-1 inline size-3.5 text-white/35" />
                {s.fps || "—"}
              </p>
              <p className="hidden text-center text-sm text-white/60 md:block">{s.ping ? `${s.ping} ms` : "—"}</p>
              <button
                onClick={() => play({ placeId: game.placeId, universeId: game.universeId, name: game.name, iconUrl: game.iconUrl, jobId: s.id })}
                className="btn-acc shine cursor-pointer rounded-xl px-4 py-2 text-sm font-bold"
              >
                Войти
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
