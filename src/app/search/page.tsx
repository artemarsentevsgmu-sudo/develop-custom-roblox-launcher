"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Gamepad2, SearchX, UserRound } from "lucide-react";
import { useFetch } from "@/lib/client";
import type { SearchPayload } from "@/lib/shared";
import { EmptyState, ErrorView, LoaderView, Page, SectionHeader, SmartImage } from "@/components/ui";
import { GameCard } from "@/components/game";
import { usePageTitle } from "@/components/shell";

export default function SearchPage() {
  return (
    <Suspense fallback={<Page><LoaderView label="Открываем поиск…" /></Page>}>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();
  usePageTitle(q ? `Поиск: ${q}` : "Поиск");
  const { data, error, loading, reload } = useFetch<SearchPayload>(
    q ? `/api/roblox/search?q=${encodeURIComponent(q)}` : null
  );

  return (
    <Page className="space-y-9">
      <header>
        <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Поиск по Roblox</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          {q ? (
            <>
              Результаты: <span className="text-gradient">«{q}»</span>
            </>
          ) : (
            "Начните вводить запрос"
          )}
        </h1>
      </header>

      {!q ? (
        <EmptyState
          icon={SearchX}
          title="Пустой запрос"
          hint="Нажмите ⌘K, чтобы открыть быстрый поиск поверх любой страницы"
        />
      ) : loading ? (
        <LoaderView label="Ищем по всей метавселенной…" />
      ) : error ? (
        <ErrorView message={error} onRetry={reload} />
      ) : !data || (!data.games.length && !data.users.length) ? (
        <EmptyState icon={SearchX} title={`По запросу «${q}» пусто`} hint="Проверьте правописание или попробуйте короче" />
      ) : (
        <>
          {data.games.length > 0 && (
            <section>
              <SectionHeader title={`Миры · ${data.games.length}`} />
              <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data.games.map((g) => (
                  <GameCard key={g.universeId} game={g} className="w-full sm:w-full" />
                ))}
              </div>
            </section>
          )}

          {data.users.length > 0 && (
            <section>
              <SectionHeader title={`Игроки · ${data.users.length}`} />
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {data.users.map((u) => (
                  <Link
                    key={u.id}
                    href={`/profile/${encodeURIComponent(u.name)}`}
                    className="glass card-hover flex items-center gap-3.5 rounded-2xl p-4"
                  >
                    {u.avatar ? (
                      <SmartImage src={u.avatar} alt="" className="size-14 rounded-full object-cover ring-2 ring-white/10" />
                    ) : (
                      <span className="grid size-14 place-items-center rounded-full bg-white/8">
                        <UserRound className="size-6 text-white/40" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-bold">{u.displayName}</span>
                      <span className="block truncate text-sm text-white/45">@{u.name}</span>
                      {u.description && (
                        <span className="mt-1 line-clamp-1 block text-xs text-white/35">{u.description}</span>
                      )}
                    </span>
                    <Gamepad2 className="ml-auto size-4 shrink-0 text-white/25" />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </Page>
  );
}
