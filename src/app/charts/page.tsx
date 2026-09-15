"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flame, Star, TrendingUp, Users, ThumbsUp, Eye, Crown } from "lucide-react";
import { useFetch } from "@/lib/client";
import { cx, fmtCompact, type ChartsPayload, type GameSummary } from "@/lib/shared";
import { CountUp, ErrorView, LoaderView, Page, SmartImage, Tabs } from "@/components/ui";
import { PlayFab } from "@/components/game";
import { usePageTitle } from "@/components/shell";

const TABS = [
  { key: "top", label: "По игрокам", icon: Flame },
  { key: "rated", label: "По рейтингу", icon: Star },
  { key: "trending", label: "Хиты недели", icon: TrendingUp },
];

const HINTS: Record<string, string> = {
  top: "Самые населённые миры метавселенной прямо сейчас",
  rated: "Миры с лучшей оценкой сообщества",
  trending: "Обновляемая ежедневная подборка",
};

export default function ChartsPage() {
  usePageTitle("Чарты");
  const [tab, setTab] = useState("top");
  const { data, error, loading, reload } = useFetch<ChartsPayload>("/api/roblox/charts");

  const list: GameSummary[] = data ? (data[tab as keyof ChartsPayload] ?? []) : [];

  return (
    <Page className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Roblox Charts</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            <span className="text-gradient">Чарты</span> метавселенной
          </h1>
          <p className="mt-2 text-sm text-white/45">{HINTS[tab]}</p>
        </div>
        <Tabs tabs={TABS} value={tab} onChange={setTab} />
      </header>

      {loading ? (
        <LoaderView label="Считаем игроков…" />
      ) : error ? (
        <ErrorView message={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {list.slice(0, 3).map((g, i) => (
              <PodiumCard key={g.universeId} game={g} rank={i + 1} index={i} />
            ))}
          </div>
          <div className="glass overflow-hidden rounded-[26px]">
            <div className="hidden grid-cols-[56px_1fr_150px_150px_120px_110px] items-center gap-3 border-b border-white/8 px-5 py-3 text-[11px] tracking-wider text-white/40 uppercase lg:grid">
              <span>#</span>
              <span>Мир</span>
              <span className="text-right">Сейчас играют</span>
              <span className="text-right">Визиты</span>
              <span className="text-center">Рейтинг</span>
              <span />
            </div>
            <div className="divide-y divide-white/6">
              {list.slice(3).map((g, i) => (
                <ChartRow key={g.universeId} game={g} rank={i + 4} />
              ))}
              {list.length <= 3 && (
                <p className="p-8 text-center text-sm text-white/40">Пока пусто — попробуйте другую вкладку</p>
              )}
            </div>
          </div>
        </>
      )}
    </Page>
  );
}

function PodiumCard({ game, rank, index }: { game: GameSummary; rank: number; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/game/${game.universeId}`}
        className="card-hover shine group relative block overflow-hidden rounded-[26px] border border-white/10 bg-white/4 p-5"
      >
        <div className="absolute -top-8 -right-3 font-display text-[120px] leading-none font-black text-white/6 transition-colors group-hover:text-white/10">
          {rank}
        </div>
        <div className="relative flex items-start justify-between">
          <SmartImage src={game.iconUrl} alt={game.name} className="size-20 rounded-2xl object-cover" />
          <span
            className={cx(
              "chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold",
              rank === 1 && "text-amber-300"
            )}
          >
            <Crown className="size-3.5" />
            ТОП {rank}
          </span>
        </div>
        <h3 className="relative mt-4 truncate text-lg font-bold">{game.name}</h3>
        <p className="relative truncate text-sm text-white/45">{game.creatorName}</p>
        <div className="relative mt-4 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5">
            <Users className="size-4" style={{ color: "var(--acc2)" }} />
            <CountUp value={game.playing} />
          </span>
          {game.rating != null && (
            <span className="flex items-center gap-1.5 text-emerald-300">
              <ThumbsUp className="size-4" /> {game.rating}%
            </span>
          )}
        </div>
        <div className="relative mt-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <PlayFab game={game} className="absolute right-0 -bottom-1" />
        </div>
      </Link>
    </motion.div>
  );
}

function ChartRow({ game, rank }: { game: GameSummary; rank: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -14 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        href={`/game/${game.universeId}`}
        className="grid grid-cols-[40px_1fr_auto] items-center gap-3 px-5 py-3.5 transition hover:bg-white/4 lg:grid-cols-[56px_1fr_150px_150px_120px_110px]"
      >
        <span className="font-display text-lg font-black text-white/35">{rank}</span>
        <span className="flex min-w-0 items-center gap-3">
          <SmartImage src={game.iconUrl} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
          <span className="min-w-0">
            <span className="block truncate font-semibold">{game.name}</span>
            <span className="block truncate text-xs text-white/40">{game.creatorName}</span>
          </span>
        </span>
        <span className="hidden text-right text-sm lg:block">
          <Users className="mr-1.5 inline size-3.5 text-white/35" />
          {fmtCompact(game.playing)}
        </span>
        <span className="hidden text-right text-sm text-white/60 lg:block">
          <Eye className="mr-1.5 inline size-3.5 text-white/35" />
          {fmtCompact(game.visits)}
        </span>
        <span className="hidden text-center lg:block">
          {game.rating != null ? (
            <span className="chip rounded-full px-2.5 py-1 text-xs font-semibold text-emerald-300">
              {game.rating}%
            </span>
          ) : (
            <span className="text-xs text-white/30">—</span>
          )}
        </span>
        <span className="justify-self-end">
          <PlayFab game={game} className="size-9" />
        </span>
      </Link>
    </motion.div>
  );
}
