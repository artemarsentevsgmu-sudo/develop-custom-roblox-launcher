"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Heart, Search, Layers, Package, ExternalLink, Crown, ShoppingBag } from "lucide-react";
import { api } from "@/lib/client";
import React from "react";
import { cx, fmtCompact, type CatalogItem, type CatalogPayload } from "@/lib/shared";
import { EmptyState, ErrorView, LoaderView, Page, SmartImage } from "@/components/ui";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";
import { ComparePanel } from "@/components/compare";

const CATEGORIES = [
  { key: "CommunityCreations", label: "Сообщество" },
  { key: "All", label: "Весь каталог" },
  { key: "Collectibles", label: "Коллекционные" },
  { key: "Premium", label: "Премиум" },
  { key: "AvatarAnimations", label: "Анимации" },
  { key: "Clothing", label: "Одежда" },
  { key: "Gear", label: "Снаряжение" },
];

const SORTS = [
  { key: "2", label: "Популярные" },
  { key: "1", label: "Новые" },
  { key: "3", label: "Цена ↑" },
  { key: "4", label: "Цена ↓" },
];

export default function CatalogPage() {
  usePageTitle("Магазин аватаров");
  const [category, setCategory] = useState("CommunityCreations");
  const [sort, setSort] = useState("2");
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<CatalogItem[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  React.useEffect(() => {
    const t = setTimeout(() => setQuery(keyword.trim()), 350);
    return () => clearTimeout(t);
  }, [keyword]);

  React.useEffect(() => {
    let dead = false;
    setLoading(true);
    setItems(null);
    setError(null);
    const params = new URLSearchParams({ category, sortType: sort, limit: "30" });
    if (query) params.set("keyword", query);
    api<CatalogPayload>(`/api/roblox/catalog?${params}`)
      .then((d) => {
        if (dead) return;
        setItems(d.items);
        setCursor(d.nextCursor);
      })
      .catch((e) => !dead && setError(e.message))
      .finally(() => !dead && setLoading(false));
    return () => {
      dead = true;
    };
  }, [category, sort, query, reloadKey]);

  const loadMore = async () => {
    if (!cursor) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams({ category, sortType: sort, limit: "30", cursor });
      if (query) params.set("keyword", query);
      const d = await api<CatalogPayload>(`/api/roblox/catalog?${params}`);
      setItems((prev) => [...(prev ?? []), ...d.items.filter((n) => !(prev ?? []).some((p) => p.id === n.id && p.type === n.type))]);
      setCursor(d.nextCursor);
    } catch {
      /* keep existing */
    }
    setLoadingMore(false);
  };

  const catLabel = useMemo(() => CATEGORIES.find((c) => c.key === category)?.label ?? "", [category]);

  return (
    <Page className="space-y-7">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Avatar Shop</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Магазин <span className="text-gradient">аватаров</span>
          </h1>
          <p className="mt-2 text-sm text-white/45">{catLabel} · живой каталог Roblox</p>
        </div>
        <div className="flex w-full max-w-md items-center gap-2.5">
          <div className="chip flex flex-1 items-center gap-2.5 rounded-2xl px-4">
            <Search className="size-4 shrink-0 text-white/40" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Название предмета…"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/35"
            />
          </div>
        </div>
      </header>

      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={cx(
              "shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-all duration-300",
              category === c.key ? "chip-acc text-white shadow-lg" : "chip text-white/55 hover:text-white"
            )}
            style={category === c.key ? { boxShadow: "0 8px 28px -10px var(--acc1)" } : undefined}
          >
            {c.label}
          </button>
        ))}
      </div>

      <ComparePanel initialKeyword={query} category={category} />

      <div className="flex items-center gap-2">
        <span className="text-xs tracking-wider text-white/40 uppercase">Сортировка</span>
        <div className="flex gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cx(
                "cursor-pointer rounded-xl px-3 py-1.5 text-xs font-semibold transition",
                sort === s.key ? "chip-acc" : "chip text-white/50 hover:text-white"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoaderView label="Открываем витрину…" />
      ) : error ? (
        <ErrorView message={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : !items?.length ? (
        <EmptyState
          icon={ShoppingBag}
          title="Ничего не нашлось"
          hint="Попробуйте другую категорию или измените поисковый запрос"
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {items.map((item, i) => (
              <ItemCard key={`${item.type}-${item.id}`} item={item} index={i} />
            ))}
          </div>
          {cursor && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-acc shine cursor-pointer rounded-2xl px-8 py-3 text-sm font-bold disabled:opacity-50"
              >
                {loadingMore ? "Загружаем…" : "Показать ещё"}
              </button>
            </div>
          )}
        </>
      )}
    </Page>
  );
}

function ItemCard({ item, index }: { item: CatalogItem; index: number }) {
  const href =
    item.type === "Bundle"
      ? `https://www.roblox.com/bundles/${item.id}/`
      : `https://www.roblox.com/catalog/${item.id}/`;
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index % 12, 10) * 0.04, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="card-hover shine group relative overflow-hidden rounded-[22px] border border-white/8 bg-white/4"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-white/8 to-transparent">
        <SmartImage
          src={item.thumb}
          alt={item.name}
          className="size-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {item.limited && (
            <span className="chip flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold text-amber-300">
              <Crown className="size-3" /> LIMITED
            </span>
          )}
          {item.parts ? (
            <span className="chip flex items-center gap-1 rounded-full bg-black/45 px-2 py-1 text-[10px] font-bold text-sky-300">
              <Layers className="size-3" /> {item.parts} в бандле
            </span>
          ) : null}
        </div>
        <span className="chip absolute right-2 bottom-2 grid size-7 place-items-center rounded-full bg-black/45 opacity-0 transition group-hover:opacity-100">
          <ExternalLink className="size-3.5" />
        </span>
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-semibold">{item.name}</p>
        <div className="mt-2 flex items-center justify-between">
          <p className="flex items-center gap-1 text-sm font-bold">
            {item.price != null ? (
              <>
                <RobuxIcon className="size-3.5" style={{ color: "var(--acc2)" }} />
                {fmtCompact(item.price)}
              </>
            ) : (
              <span className="flex items-center gap-1 text-xs text-white/40">
                <Package className="size-3" /> {item.priceStatus === "Free" ? "Бесплатно" : "Нет в продаже"}
              </span>
            )}
          </p>
          {item.favorites > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-white/40">
              <Heart className="size-3" /> {fmtCompact(item.favorites)}
            </span>
          )}
        </div>
      </div>
    </motion.a>
  );
}
