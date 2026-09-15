"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  Heart,
  Server,
  BadgeCheck,
  Share2,
  Check,
  ChevronLeft,
  CalendarDays,
  LayoutGrid,
  ShoppingCart,
  Award,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { copyText, useFetch } from "@/lib/client";
import { cx, fmtDate, fmtCompact, type GameDetail } from "@/lib/shared";
import { CountUp, ErrorView, LoaderView, Page, Rail, SectionHeader, SmartImage, Skeleton, Tabs } from "@/components/ui";
import { GameCard, MediaGallery, PlayCTA, RatingBar, ServerTable, StatItem } from "@/components/game";
import { useStore } from "@/components/store";
import { PinButton } from "@/components/pins";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";

export default function GamePage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const { data, error, loading, reload } = useFetch<GameDetail>(
    id ? `/api/roblox/game/${encodeURIComponent(id)}` : null
  );
  usePageTitle(data?.name ?? "Мир");
  const [tab, setTab] = useState("about");

  if (loading) return <GameSkeleton />;
  if (error || !data) return <ErrorView message={error ?? "Мир не найден"} onRetry={reload} />;

  const game = data;
  const desc = game.description.replace(/<[^>]+>/g, "").trim();

  return (
    <Page className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/"
          className="btn-ghost flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:text-white"
        >
          <ChevronLeft className="size-4" /> К витрине
        </Link>
        <ShareButton />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* main column */}
        <div className="min-w-0 space-y-6">
          <Tabs
            tabs={[
              { key: "about", label: "Обзор", icon: LayoutGrid },
              { key: "store", label: `Магазин${game.passes.length ? ` · ${game.passes.length}` : ""}`, icon: ShoppingCart },
              { key: "servers", label: `Серверы${game.servers.length ? ` · ${game.servers.length}` : ""}`, icon: Server },
            ]}
            value={tab}
            onChange={setTab}
          />

          {tab === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              <MediaGallery images={game.media} name={game.name} />
              <div className="glass rounded-3xl p-6">
                <h2 className="font-display mb-3 text-lg font-bold">Об этом мире</h2>
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-white/70">
                  {desc || "Создатель ещё не добавил описание."}
                </p>
              </div>
              {game.badges.length > 0 && (
                <div>
                  <SectionHeader title="Награды мира" hint={`${game.badges.length} бейджей можно заработать`} />
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {game.badges.map((b) => (
                      <div key={b.id} className="glass card-hover flex items-start gap-3 rounded-2xl p-4">
                        <div
                          className="grid size-10 shrink-0 place-items-center rounded-xl"
                          style={{ background: "var(--acc-soft)" }}
                        >
                          <Award className="size-5" style={{ color: "var(--acc2)" }} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold">{b.name}</p>
                          {b.description && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-white/45">{b.description}</p>
                          )}
                          {typeof b.winRate === "number" && b.winRate > 0 && (
                            <p className="mt-1 text-[11px] text-white/40">
                              получают ≈ {b.winRate < 1 ? b.winRate.toFixed(1) : Math.round(b.winRate)}% игроков
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {tab === "store" && (
            <motion.div
              key="store"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6"
            >
              {game.passes.length === 0 ? (
                <div className="glass rounded-3xl p-10 text-center">
                  <ShoppingCart className="mx-auto mb-3 size-9 text-white/25" />
                  <p className="font-bold">Внутриигровых пропусков нет</p>
                  <p className="mt-1 text-sm text-white/45">Создатель пока не продаёт пропуски в этом мире</p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-white/50">
                    Покупка откроется на официальном сайте Roblox — там же завершите оплату
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {game.passes.map((p) => (
                      <a
                        key={p.id}
                        href={`https://www.roblox.com/game-pass/${p.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="glass card-hover shine group relative overflow-hidden rounded-2xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <SmartImage src={p.iconUrl} alt="" className="size-16 rounded-xl object-cover" />
                          <div className="min-w-0 pt-1">
                            <p className="line-clamp-2 text-sm leading-snug font-bold">{p.name}</p>
                            <p className="mt-1.5 flex items-center gap-1.5 text-sm font-bold text-amber-300">
                              <RobuxIcon className="size-4" />
                              {p.price != null ? fmtCompact(p.price) : "Не продаётся"}
                            </p>
                          </div>
                        </div>
                        <span className="btn-ghost mt-4 flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold">
                          Купить на Roblox <ExternalLink className="size-3" />
                        </span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {tab === "servers" && (
            <motion.div
              key="servers"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/50">
                  Живые публичные серверы — заходите на конкретный инстанс в один клик
                </p>
                <button
                  onClick={reload}
                  className="btn-ghost shrink-0 cursor-pointer rounded-xl px-3.5 py-2 text-xs font-semibold"
                >
                  Обновить
                </button>
              </div>
              <ServerTable game={game} servers={game.servers} />
            </motion.div>
          )}

          {game.similar.length > 0 && (
            <section className="pt-2">
              <SectionHeader title="Похожие миры" />
              <Rail>
                {game.similar.map((g) => (
                  <GameCard key={g.universeId} game={g} />
                ))}
              </Rail>
            </section>
          )}
        </div>

        {/* side panel */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="glass-strong shine relative space-y-5 overflow-hidden rounded-[26px] p-6"
          >
            <div
              className="pointer-events-none absolute -top-16 right-0 h-40 w-40 opacity-30 blur-3xl"
              style={{ background: "var(--acc1)" }}
            />
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <SmartImage src={game.iconUrl} alt={game.name} className="size-20 rounded-2xl object-cover" eager />
                <span className="anim-pulse-ring absolute -inset-1 rounded-[20px]" />
              </div>
              <div className="min-w-0">
                <h1 className="line-clamp-2 text-xl leading-tight font-bold">{game.name}</h1>
                <p className="mt-1 flex items-center gap-1.5 truncate text-sm text-white/55">
                  {game.creatorVerified && <BadgeCheck className="size-4 shrink-0 text-sky-400" />}
                  <span className="truncate">{game.creatorName}</span>
                  {game.creatorType === "Group" && <span className="chip rounded px-1.5 py-0.5 text-[10px]">группа</span>}
                </p>
              </div>
            </div>

            <RatingBar up={game.upVotes} down={game.downVotes} />

            <div className="flex flex-wrap gap-2 text-xs">
              {game.genre && <span className="chip rounded-full px-2.5 py-1">{game.genre}</span>}
              <span className="chip flex items-center gap-1.5 rounded-full px-2.5 py-1">
                <Users className="size-3" /> {game.playing > 0 ? `${fmtCompact(game.playing)} в сети` : "пусто"}
              </span>
              <span className="chip flex items-center gap-1.5 rounded-full px-2.5 py-1">
                <CalendarDays className="size-3" /> {fmtDate(game.created)}
              </span>
              {game.price ? (
                <span className="chip flex items-center gap-1 rounded-full px-2.5 py-1 text-amber-300">
                  <RobuxIcon className="size-3" /> платный доступ · {fmtCompact(game.price)}
                </span>
              ) : (
                <span className="chip flex items-center gap-1 rounded-full px-2.5 py-1 text-emerald-300">
                  <Sparkles className="size-3" /> бесплатно
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              <PlayCTA game={game} className="w-full" label="Играть" />
              <div className="grid grid-cols-2 gap-2.5">
                <FavButton game={game} />
                <PinButton game={game} />
              </div>
              <ShareButton small />
            </div>
          </motion.div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatItem icon={Users} label="В сети" value={game.playing} />
            <StatItem icon={Eye} label="Визиты" value={game.visits} />
            <StatItem icon={Heart} label="Избранное" value={game.favorites} />
            <StatItem icon={Server} label="Слоты" value={game.maxPlayers} />
          </div>
        </aside>
      </div>
    </Page>
  );
}

function FavButton({ game }: { game: Pick<GameDetail, "universeId" | "placeId" | "name" | "iconUrl"> }) {
  const { toggleFavorite, isFavorite } = useStore();
  const fav = isFavorite(game.universeId);
  return (
    <button
      onClick={() => toggleFavorite(game)}
      className={cx(
        "flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        fav ? "bg-rose-500/90 text-white shadow-lg shadow-rose-500/30" : "btn-ghost"
      )}
    >
      <Heart className={cx("size-4", fav && "fill-current")} />
      {fav ? "В библиотеке" : "В библиотеку"}
    </button>
  );
}

function ShareButton({ small }: { small?: boolean }) {
  const [ok, setOk] = useState(false);
  const share = async () => {
    const done = await copyText(window.location.href);
    if (done) {
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    }
  };
  return (
    <button
      onClick={share}
      className={cx(
        "btn-ghost flex cursor-pointer items-center gap-2 rounded-xl font-semibold",
        small ? "justify-center px-4 py-3 text-sm" : "px-3 py-2 text-sm"
      )}
    >
      {ok ? <Check className="size-4 text-emerald-400" /> : <Share2 className="size-4" />}
      {ok ? "Ссылка скопирована" : "Поделиться"}
    </button>
  );
}

function GameSkeleton() {
  return (
    <Page className="space-y-6">
      <Skeleton className="h-9 w-40" />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-[24px]" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
        <Skeleton className="h-[430px] rounded-[26px]" />
      </div>
    </Page>
  );
}
