"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flame, Sparkles, ArrowUpRight } from "lucide-react";
import { useFetch } from "@/lib/client";
import { fmtCompact, type GameSummary, type HomePayload } from "@/lib/shared";
import { useStore } from "@/components/store";
import { CountUp, ErrorView, Page, Rail, SectionHeader, Skeleton } from "@/components/ui";
import { GameCard, HeroCarousel } from "@/components/game";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";
import { useAuth } from "@/components/auth";
import { WidgetBoard } from "@/components/widgets";
import { PinnedRail } from "@/components/pins";

export default function HomePage() {
  usePageTitle("Главная");
  const { data, error, loading, reload } = useFetch<HomePayload>("/api/roblox/home");
  const { me } = useAuth();

  if (error && !data) return <ErrorView message={error} onRetry={reload} />;

  return (
    <Page className="space-y-10">
      {loading || !data ? (
        <HomeSkeleton />
      ) : (
        <>
          <HeroCarousel games={data.hero} />

          <WidgetBoard />

          <PinnedRail />

          <ContinueRail />

          <section className="glass grid grid-cols-2 gap-4 rounded-3xl p-5 sm:grid-cols-4">
            <div>
              <p className="text-xs tracking-[0.2em] text-white/40 uppercase">Сейчас в сети</p>
              <p className="font-display mt-1 text-2xl font-bold">
                <CountUp value={data.stats.playingNow} />
              </p>
              <p className="text-xs text-white/40">игроков в подборке</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] text-white/40 uppercase">Миров</p>
              <p className="font-display mt-1 text-2xl font-bold">{data.stats.games}</p>
              <p className="text-xs text-white/40">в живых чартах</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] text-white/40 uppercase">Источник</p>
              <p className="font-display mt-1 flex items-center gap-2 text-2xl font-bold">
                {data.live ? "Live" : "Резерв"}
                <span className={`size-2.5 rounded-full ${data.live ? "bg-emerald-400" : "bg-amber-400"}`} />
              </p>
              <p className="text-xs text-white/40">Roblox Web API</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] text-white/40 uppercase">Обновлено</p>
              <p className="font-display mt-1 text-2xl font-bold">
                {new Date().toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </p>
              <p className="text-xs text-white/40">кэш каждые 45 сек</p>
            </div>
          </section>

          {data.rails.map((rail) => (
            <section key={rail.key}>
              <SectionHeader title={rail.title} href="/charts" />
              <Rail>
                {rail.items.map((g) => (
                  <GameCard key={g.universeId} game={g} />
                ))}
              </Rail>
            </section>
          ))}

          <section className="grid gap-4 md:grid-cols-2">
            <Link
              href="/robux"
              className="card-hover shine group relative overflow-hidden rounded-[26px] border border-white/10 p-7"
              style={{ background: "linear-gradient(140deg, rgba(124,92,255,.25), rgba(53,224,255,.08))" }}
            >
              <RobuxIcon className="absolute -right-6 -bottom-8 size-40 rotate-12 text-white/8 transition-transform duration-700 group-hover:rotate-45" />
              <RobuxIcon className="size-9" style={{ color: "var(--acc2)" }} />
              <h3 className="font-display mt-4 text-2xl font-bold">Robux без суеты</h3>
              <p className="mt-1.5 max-w-sm text-sm text-white/55">
                Все номиналы, подарочные карты и быстрый переход к покупке на официальном сайте
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--acc2)" }}>
                К покупке <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
            <Link
              href="/premium"
              className="card-hover shine group relative overflow-hidden rounded-[26px] border border-white/10 p-7"
              style={{ background: "linear-gradient(140deg, rgba(255,92,168,.2), rgba(124,92,255,.08))" }}
            >
              <Sparkles className="absolute -right-4 -bottom-6 size-36 rotate-12 text-white/8 transition-transform duration-700 group-hover:-rotate-12" />
              <Sparkles className="size-9" style={{ color: "var(--acc3)" }} />
              <h3 className="font-display mt-4 text-2xl font-bold">Roblox Premium</h3>
              <p className="mt-1.5 max-w-sm text-sm text-white/55">
                Ежемесячные робуксы, трейд и эксклюзивы — три тарифа на выбор
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--acc3)" }}>
                Тарифы <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </Link>
          </section>

          <section className="glass flex flex-col items-center gap-2 rounded-3xl p-6 text-center">
            <p className="flex items-center gap-2 text-sm text-white/50">
              <Flame className="size-4" style={{ color: "var(--acc2)" }} />
              Живые данные каждые 45 секунд — Roblox API
            </p>
            <p className="font-display text-lg font-bold">
              {fmtCompact(data.stats.playingNow)} игроков уже в игре прямо сейчас
            </p>
          </section>
        </>
      )}
    </Page>
  );
}

/* Real "continue playing": the launcher's own launch history (what you
 * actually started from RoLaunch), enriched with live Roblox data.
 * Roblox has no public "recently played" API — generic recommendations
 * would be misleading, so we never show those here. */
function ContinueRail() {
  const { recents, clearRecents } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ids = recents
    .map((r) => r.universeId)
    .filter(Boolean)
    .slice(0, 16);
  const { data } = useFetch<{ data: GameSummary[] }>(
    mounted && ids.length ? `/api/roblox/games?ids=${ids.join(",")}` : null,
    [ids.join(",")]
  );

  if (!mounted || !recents.length) return null;

  const byId = new Map((data?.data ?? []).map((g) => [g.universeId, g]));
  const games: GameSummary[] = recents
    .slice(0, 16)
    .map((r) => byId.get(r.universeId))
    .filter((g): g is GameSummary => Boolean(g));

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <SectionHeader
          title="Продолжить игру"
          hint="Миры, которые вы запускали через RoLaunch"
          className="flex-1"
        />
        <button
          onClick={clearRecents}
          className="mb-4 shrink-0 cursor-pointer text-xs text-white/40 transition hover:text-white"
        >
          очистить
        </button>
      </div>
      {games.length ? (
        <Rail>
          {games.map((g) => (
            <GameCard key={g.universeId} game={g} />
          ))}
        </Rail>
      ) : (
        <div className="glass rounded-3xl p-5 text-sm text-white/45">Загружаем историю запусков…</div>
      )}
    </section>
  );
}

function HomeSkeleton() {
  return (
    <>
      <Skeleton className="h-[420px] w-full rounded-[32px]" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, r) => (
        <div key={r} className="space-y-4">
          <Skeleton className="h-7 w-56" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-44 shrink-0" />
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
