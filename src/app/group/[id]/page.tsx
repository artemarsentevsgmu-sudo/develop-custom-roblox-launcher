"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Users,
  BadgeCheck,
  ChevronLeft,
  Megaphone,
  Crown,
  Gamepad2,
  Eye,
  ExternalLink,
  Link2,
  ShieldCheck,
  Coins,
} from "lucide-react";
import { useFetch } from "@/lib/client";
import { fmtCompact, fmtFull, type GameSummary } from "@/lib/shared";
import { CountUp, ErrorView, Page, SectionHeader, SmartImage, Skeleton } from "@/components/ui";
import { GameCard } from "@/components/game";
import { Donut } from "@/components/charts";
import { usePageTitle } from "@/components/shell";

interface GroupPayload {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  owner: { userId: number; username: string; displayName: string; avatar: string | null } | null;
  shout: { body: string; poster: string; created: string } | null;
  icon: string | null;
  verified: boolean;
  publicEntry: boolean;
  locked: boolean;
  roles: { id: number; name: string; rank: number; memberCount: number; share: number }[];
  games: GameSummary[];
  socials: { type: string; url: string; title: string }[];
  stats: { playing: number; visits: number; games: number; topRole: string };
}

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";
  const { data, error, loading, reload } = useFetch<GroupPayload>(
    id ? `/api/roblox/group/${encodeURIComponent(id)}` : null
  );
  usePageTitle(data?.name ?? "Группа");

  if (loading) {
    return (
      <Page className="space-y-6">
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-64 rounded-[32px]" />
        <Skeleton className="h-40 rounded-3xl" />
      </Page>
    );
  }
  if (error || !data) return <ErrorView message={error ?? "Группа не найдена"} onRetry={reload} />;

  return (
    <Page className="space-y-7">
      <Link
        href="/groups"
        className="btn-ghost inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:text-white"
      >
        <ChevronLeft className="size-4" /> К группам
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative overflow-hidden rounded-[32px] p-6 md:p-9"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-35"
          style={{ background: "linear-gradient(120deg, var(--acc1), var(--acc2) 55%, var(--acc3))", filter: "blur(65px)" }}
        />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end">
          <SmartImage
            src={data.icon}
            alt={data.name}
            className="anim-floaty mx-auto size-32 rounded-[26px] object-cover shadow-2xl shadow-black/60 md:mx-0 md:size-40"
            eager
          />
          <div className="min-w-0 flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{data.name}</h1>
              {data.verified && <BadgeCheck className="size-6 text-sky-400" />}
              {data.publicEntry ? (
                <span className="chip rounded-full px-3 py-1 text-xs font-bold text-emerald-300">открытая</span>
              ) : (
                <span className="chip rounded-full px-3 py-1 text-xs font-bold text-amber-300">по заявке</span>
              )}
            </div>
            <p className="mt-2 text-sm text-white/45">ID {data.id}</p>
            {data.description && (
              <p className="mx-auto mt-3 line-clamp-3 max-w-2xl text-sm leading-relaxed whitespace-pre-line text-white/60 md:mx-0">
                {data.description}
              </p>
            )}
            <div className="mt-5 flex flex-wrap justify-center gap-2.5 md:justify-start">
              {data.owner && (
                <Link
                  href={`/profile/${encodeURIComponent(data.owner.username)}`}
                  className="chip flex items-center gap-2 rounded-2xl px-3 py-2 transition hover:border-white/25"
                >
                  {data.owner.avatar ? (
                    <SmartImage src={data.owner.avatar} alt="" className="size-7 rounded-full" />
                  ) : (
                    <Crown className="size-4 text-amber-300" />
                  )}
                  <span className="text-sm">
                    <span className="text-white/45">владелец</span>{" "}
                    <strong>{data.owner.displayName}</strong>
                  </span>
                </Link>
              )}
              <a
                href={`https://www.roblox.com/groups/${data.id}`}
                target="_blank"
                rel="noreferrer"
                className="btn-acc shine flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold"
              >
                Открыть на Roblox <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      {data.shout && (
        <motion.div
          initial={{ opacity: 0, x: -14 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass flex items-start gap-3.5 rounded-[22px] border-l-4 p-5"
          style={{ borderLeftColor: "var(--acc1)" }}
        >
          <Megaphone className="mt-0.5 size-5 shrink-0" style={{ color: "var(--acc2)" }} />
          <div className="min-w-0">
            <p className="text-[11px] tracking-[0.2em] text-white/40 uppercase">Объявление группы</p>
            <p className="mt-1.5 text-sm whitespace-pre-line text-white/75">{data.shout.body}</p>
            {data.shout.poster && (
              <p className="mt-1.5 text-xs text-white/40">— {data.shout.poster}</p>
            )}
          </div>
        </motion.div>
      )}

      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <StatBox icon={Users} label="Участников" value={data.memberCount} />
        <StatBox icon={Gamepad2} label="Онлайн в мирах" value={data.stats.playing} />
        <StatBox icon={Eye} label="Визитов всего" value={data.stats.visits} />
        <StatBox icon={Coins} label="Публичных миров" value={data.stats.games} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <section>
          <SectionHeader title="Миры группы" hint={data.games.length ? `${data.games.length} публичных` : undefined} />
          {data.games.length ? (
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-4">
              {data.games.map((g) => (
                <GameCard key={g.universeId} game={g} className="w-full sm:w-full" />
              ))}
            </div>
          ) : (
            <div className="glass rounded-3xl p-8 text-center text-sm text-white/45">
              У группы нет публичных миров
            </div>
          )}
        </section>

        <aside className="space-y-4">
          <div className="glass rounded-[26px] p-5 md:p-6">
            <h2 className="font-display mb-4 flex items-center gap-2 text-base font-bold">
              <ShieldCheck className="size-4" style={{ color: "var(--acc2)" }} /> Состав по рангам
            </h2>
            <Donut
              slices={data.roles
                .filter((r) => r.memberCount > 0)
                .slice(0, 7)
                .map((r) => ({ label: r.name, value: r.memberCount }))}
              size={140}
            />
            <div className="mt-4 space-y-1.5 border-t border-white/8 pt-3">
              {data.roles.slice(0, 10).map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-xs">
                  <span className="chip w-9 shrink-0 rounded px-1.5 py-0.5 text-center font-mono">{r.rank}</span>
                  <span className="min-w-0 flex-1 truncate text-white/70">{r.name}</span>
                  <span className="font-semibold">{fmtCompact(r.memberCount)}</span>
                </div>
              ))}
            </div>
          </div>

          {data.socials.length > 0 && (
            <div className="glass rounded-[26px] p-5 md:p-6">
              <h2 className="font-display mb-3 flex items-center gap-2 text-base font-bold">
                <Link2 className="size-4" style={{ color: "var(--acc3)" }} /> Соцсети
              </h2>
              <div className="space-y-2">
                {data.socials.map((s, i) => (
                  <a
                    key={i}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost flex items-center justify-between gap-2 rounded-xl px-3.5 py-2.5 text-sm"
                  >
                    <span className="truncate">{s.title || s.type}</span>
                    <ExternalLink className="size-3.5 shrink-0 text-white/40" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <Link
            href="/studio/payouts"
            className="glass card-hover shine block rounded-[26px] p-5 text-center md:p-6"
          >
            <Coins className="mx-auto size-7" style={{ color: "var(--acc2)" }} />
            <p className="font-display mt-2 font-bold">Выплатить участникам</p>
            <p className="mt-1 text-xs text-white/45">Перейти к массовым выплатам с этим составом</p>
          </Link>
        </aside>
      </div>
    </Page>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value: number;
}) {
  return (
    <div className="glass card-hover rounded-[22px] p-5">
      <p className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-white/40 uppercase">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="font-display mt-2 text-2xl font-black">
        <CountUp value={value} />
      </p>
      <p className="mt-0.5 text-[11px] text-white/35">{fmtFull(value)}</p>
    </div>
  );
}
