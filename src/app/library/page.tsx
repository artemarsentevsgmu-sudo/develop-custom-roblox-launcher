"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock3, LibraryBig, Trash2 } from "lucide-react";
import { useFetch } from "@/lib/client";
import type { FavEntry, GameSummary } from "@/lib/shared";
import { EmptyState, LoaderView, Page, SectionHeader, SmartImage } from "@/components/ui";
import { GameCard, PlayFab } from "@/components/game";
import { useStore } from "@/components/store";
import { usePageTitle } from "@/components/shell";

export default function LibraryPage() {
  usePageTitle("Библиотека");
  const { favorites, recents, clearFavorites, clearRecents } = useStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const ids = favorites.map((f) => f.universeId).filter(Boolean).slice(0, 60);
  const { data, loading } = useFetch<{ data: GameSummary[] }>(
    mounted && ids.length ? `/api/roblox/games?ids=${ids.join(",")}` : null
  );

  if (!mounted) return <Page>{null}</Page>;

  return (
    <Page className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Ваша коллекция</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            <span className="text-gradient">Библиотека</span>
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Избранные миры и история запусков — хранится локально на этом устройстве
          </p>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={clearFavorites}
            className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-300"
          >
            <Trash2 className="size-4" /> Очистить избранное
          </button>
        )}
      </header>

      <section>
        <SectionHeader title={`Избранное · ${favorites.length}`} />
        {favorites.length === 0 ? (
          <EmptyState
            icon={LibraryBig}
            title="Пока пусто"
            hint="Открывайте миры и нажимайте «В библиотеку» — сюда попадут ваши подборки"
            action={
              <Link href="/" className="btn-acc shine mt-2 inline-flex rounded-2xl px-6 py-3 text-sm font-bold">
                К витрине
              </Link>
            }
          />
        ) : loading && !data ? (
          <LoaderView label="Подтягиваем иконки…" />
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {(data?.data ?? []).map((g) => (
              <GameCard key={g.universeId} game={g} className="w-full sm:w-full" />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <SectionHeader title={`Недавно запускали · ${recents.length}`} className="flex-1" />
          {recents.length > 0 && (
            <button
              onClick={clearRecents}
              className="mb-4 flex cursor-pointer items-center gap-1.5 text-xs text-white/40 transition hover:text-white"
            >
              <Trash2 className="size-3.5" /> очистить историю
            </button>
          )}
        </div>
        {recents.length === 0 ? (
          <div className="glass flex items-center gap-3 rounded-3xl p-6 text-sm text-white/45">
            <Clock3 className="size-5 shrink-0 text-white/30" />
            История появится после первого запуска игры через RoLaunch
          </div>
        ) : (
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {recents.slice(0, 12).map((r) => (
              <RecentRow key={`${r.universeId}-${r.at}`} entry={r} />
            ))}
          </div>
        )}
      </section>
    </Page>
  );
}

function RecentRow({ entry }: { entry: FavEntry }) {
  return (
    <div className="glass card-hover group flex items-center gap-3.5 rounded-2xl p-3.5">
      <Link href={entry.universeId ? `/game/${entry.universeId}` : "#"} className="flex min-w-0 flex-1 items-center gap-3.5">
        <SmartImage src={entry.iconUrl} alt="" className="size-12 rounded-xl object-cover" />
        <span className="min-w-0">
          <span className="block truncate text-sm font-bold">{entry.name}</span>
          <span className="block text-xs text-white/40">
            {new Date(entry.at).toLocaleString("ru-RU", {
              day: "numeric",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </span>
      </Link>
      <PlayFab
        game={{ placeId: entry.placeId, universeId: entry.universeId, name: entry.name, iconUrl: entry.iconUrl }}
        className="size-9 opacity-70 group-hover:opacity-100"
      />
    </div>
  );
}
