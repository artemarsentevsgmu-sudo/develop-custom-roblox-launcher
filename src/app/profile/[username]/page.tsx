"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  CalendarDays,
  ChevronLeft,
  Gem,
  UserRound,
  Users,
  Heart,
  ArrowRightLeft,
  Gamepad2,
  ExternalLink,
} from "lucide-react";
import { useFetch } from "@/lib/client";
import { fmtDate, type ProfilePayload } from "@/lib/shared";
import { CountUp, ErrorView, Page, SectionHeader, SmartImage, Skeleton } from "@/components/ui";
import { GameCard } from "@/components/game";
import { usePageTitle } from "@/components/shell";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = Array.isArray(params?.username) ? params.username[0] : params?.username ?? "";
  const { data, error, loading, reload } = useFetch<ProfilePayload>(
    username ? `/api/roblox/user/${encodeURIComponent(username)}` : null
  );
  usePageTitle(data?.user.displayName ?? username ?? "Профиль");

  if (loading) return <ProfileSkeleton />;
  if (error || !data) return <ErrorView message={error ?? "Игрок не найден"} onRetry={reload} />;

  const { user, counts, games, avatarFull } = data;

  return (
    <Page className="space-y-8">
      <Link
        href="/search"
        className="btn-ghost inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:text-white"
      >
        <ChevronLeft className="size-4" /> К поиску
      </Link>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="glass-strong relative overflow-hidden rounded-[32px] p-7 md:p-10"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-40 opacity-40"
          style={{ background: "linear-gradient(120deg, var(--acc1), var(--acc2) 50%, var(--acc3))", filter: "blur(60px)" }}
        />
        <div className="relative flex flex-col gap-8 md:flex-row md:items-end">
          <div className="relative mx-auto shrink-0 md:mx-0">
            {avatarFull ? (
              <SmartImage
                src={avatarFull}
                alt={user.displayName}
                className="anim-floaty size-44 rounded-[28px] object-cover shadow-2xl shadow-black/60 md:size-52"
                eager
              />
            ) : (
              <div className="grid size-44 place-items-center rounded-[28px] bg-white/8 md:size-52">
                <UserRound className="size-16 text-white/30" />
              </div>
            )}
            <span
              className="absolute -inset-2 -z-10 rounded-[32px] opacity-60 blur-2xl"
              style={{ background: "linear-gradient(140deg, var(--acc1), var(--acc3))" }}
            />
          </div>

          <div className="min-w-0 flex-1 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2.5 md:justify-start">
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">{user.displayName}</h1>
              {user.verified && <BadgeCheck className="size-6 text-sky-400" />}
              {data.premium && (
                <span className="chip flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold" style={{ color: "var(--acc3)" }}>
                  <Gem className="size-3.5" /> PREMIUM
                </span>
              )}
            </div>
            <p className="mt-2 text-white/50">@{user.name}</p>
            <p className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-white/40 md:justify-start">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" /> с {fmtDate(user.created)}
              </span>
              <span className="chip rounded-full px-2.5 py-0.5">ID {user.id}</span>
            </p>
            {user.description && (
              <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed whitespace-pre-line text-white/60 md:mx-0">
                {user.description}
              </p>
            )}

            <div className="mt-6 flex flex-wrap justify-center gap-2.5 md:justify-start">
              <span className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5">
                <UserRound className="size-4" style={{ color: "var(--acc2)" }} />
                <strong className="font-bold"><CountUp value={counts.friends} /></strong>
                <span className="text-white/50">друзей</span>
              </span>
              <span className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5">
                <Heart className="size-4 text-rose-400" />
                <strong className="font-bold"><CountUp value={counts.followers} /></strong>
                <span className="text-white/50">подписчиков</span>
              </span>
              <span className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5">
                <ArrowRightLeft className="size-4 text-emerald-400" />
                <strong className="font-bold"><CountUp value={counts.followings} /></strong>
                <span className="text-white/50">подписок</span>
              </span>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2.5 md:justify-start">
              <a
                href={`https://www.roblox.com/users/${user.id}/profile`}
                target="_blank"
                rel="noreferrer"
                className="btn-acc shine inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold"
              >
                Открыть на Roblox <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.section>

      <section>
        <SectionHeader
          title="Миры автора"
          hint={games.length ? `${games.length} публичных плейсов` : undefined}
        />
        {games.length ? (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {games.map((g) => (
              <GameCard key={g.universeId} game={g} className="w-full sm:w-full" />
            ))}
          </div>
        ) : (
          <div className="glass flex flex-col items-center gap-3 rounded-3xl p-10 text-center">
            <div className="grid size-14 place-items-center rounded-2xl" style={{ background: "var(--acc-soft)" }}>
              <Gamepad2 className="size-7" style={{ color: "var(--acc2)" }} />
            </div>
            <p className="text-lg font-bold">Публичных миров нет</p>
            <p className="text-sm text-white/45">Или они скрыты, или пользователь пока ничего не создал</p>
          </div>
        )}
      </section>

      <div className="glass flex items-center gap-2.5 rounded-3xl p-5 text-sm text-white/50">
        <Users className="size-4 shrink-0" style={{ color: "var(--acc2)" }} />
        Статистика обновляется каждую минуту через Roblox Users & Friends API
      </div>
    </Page>
  );
}

function ProfileSkeleton() {
  return (
    <Page className="space-y-8">
      <Skeleton className="h-9 w-36" />
      <Skeleton className="h-72 w-full rounded-[32px]" />
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56" />
        ))}
      </div>
    </Page>
  );
}
