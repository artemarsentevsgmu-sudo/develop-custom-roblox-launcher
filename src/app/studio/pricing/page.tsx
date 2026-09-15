"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Tags,
  Percent,
  Plus,
  Equal,
  RotateCcw,
  CheckSquare,
  Square,
  Loader2,
  History,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Search,
  BarChart3,
} from "lucide-react";
import { api, useFetch } from "@/lib/client";
import { cx, fmtCompact, fmtFull } from "@/lib/shared";
import { ErrorView, LoaderView, Page, SectionHeader, Tabs } from "@/components/ui";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";

interface Item {
  id: number;
  assetId: number;
  name: string;
  category: string;
  price: number;
  basePrice: number;
  active: boolean;
  units: number;
  net: number;
}
interface HistoryRow {
  id: number;
  name: string;
  oldPrice: number;
  newPrice: number;
  reason: string;
  createdAt: string;
}

const PRESETS = [
  { label: "−20% распродажа", mode: "percent", value: -20 },
  { label: "−50% чёрная пятница", mode: "percent", value: -50 },
  { label: "+10% индексация", mode: "percent", value: 10 },
  { label: "Вернуть базовые", mode: "reset", value: 0 },
];

export default function PricingPage() {
  usePageTitle("Массовое изменение цен");
  const { data, error, loading, reload } = useFetch<{ items: Item[]; history: HistoryRow[] }>(
    "/api/workspace/items"
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<"percent" | "absolute" | "set" | "reset">("percent");
  const [value, setValue] = useState(-20);
  const [roundTo, setRoundTo] = useState(5);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);

  const items = data?.items ?? [];
  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          !query ||
          i.name.toLowerCase().includes(query.toLowerCase()) ||
          i.category.toLowerCase().includes(query.toLowerCase())
      ),
    [items, query]
  );

  const preview = (item: Item): number => {
    let next = item.price;
    if (mode === "percent") next = Math.round(item.price * (1 + value / 100));
    else if (mode === "absolute") next = item.price + Math.round(value);
    else if (mode === "set") next = Math.round(value);
    else next = item.basePrice;
    if (roundTo > 1) next = Math.max(roundTo, Math.round(next / roundTo) * roundTo);
    return Math.max(0, next);
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filtered.map((i) => i.id)));

  const apply = async () => {
    if (!selected.size) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await api<{ updated: number }>("/api/workspace/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ids: [...selected],
          mode,
          value,
          roundTo,
          reason: reason || PRESETS.find((p) => p.mode === mode && p.value === value)?.label,
        }),
      });
      setResult(`Обновлено предметов: ${r.updated}`);
      setSelected(new Set());
      reload();
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Ошибка");
    }
    setBusy(false);
  };

  const selectedItems = filtered.filter((i) => selected.has(i.id));
  const deltaRevenue = selectedItems.reduce((a, i) => a + (preview(i) - i.price), 0);

  return (
    <Page className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Bulk pricing</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Массовое <span className="text-gradient">изменение цен</span>
          </h1>
          <p className="mt-2 text-sm text-white/45">Распродажи и акции для всего каталога в пару кликов</p>
        </div>
      </header>

      {loading && !data ? (
        <LoaderView label="Загружаем каталог мастерской…" />
      ) : error ? (
        <ErrorView message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <section className="glass rounded-[26px] p-5 md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                onClick={toggleAll}
                className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold"
              >
                {allSelected ? <CheckSquare className="size-4" /> : <Square className="size-4" />}
                {allSelected ? "Снять все" : "Выбрать все"}
              </button>
              <div className="chip flex flex-1 items-center gap-2 rounded-xl px-3.5">
                <Search className="size-4 shrink-0 text-white/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Фильтр по названию или категории"
                  className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                />
              </div>
              <span className="chip rounded-xl px-3 py-2 text-xs font-semibold">
                выбрано {selected.size}
              </span>
            </div>

            {!items.length && (
              <div className="rounded-2xl border border-white/10 bg-white/4 p-6 text-center">
                <Tags className="mx-auto mb-3 size-8 text-white/25" />
                <p className="font-bold">Каталог пуст</p>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-white/45">
                  Здесь появятся ваши UGC-предметы. Roblox отдаёт список и цены товаров только
                  авторизованной сессии создателя, поэтому демо-данные мы намеренно не подставляем.
                </p>
              </div>
            )}
            <div className="no-scrollbar max-h-[560px] space-y-1.5 overflow-y-auto pr-1">
              {filtered.map((item) => {
                const on = selected.has(item.id);
                const next = preview(item);
                const changed = on && next !== item.price;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => toggle(item.id)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cx(
                      "flex w-full cursor-pointer items-center gap-3 rounded-2xl p-3 text-left transition",
                      on ? "chip-acc" : "bg-white/4 hover:bg-white/7"
                    )}
                  >
                    {on ? (
                      <CheckSquare className="size-4.5 shrink-0" style={{ color: "var(--acc2)" }} />
                    ) : (
                      <Square className="size-4.5 shrink-0 text-white/25" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{item.name}</span>
                      <span className="flex items-center gap-2 text-xs text-white/45">
                        <span className="chip rounded px-1.5 py-0.5">{item.category}</span>
                        <span>{fmtCompact(item.units)} продаж</span>
                        <span>{fmtCompact(item.net)} R$</span>
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-sm">
                      <span className={cx("flex items-center gap-1 font-bold", changed && "text-white/35 line-through")}>
                        <RobuxIcon className="size-3.5" />
                        {item.price}
                      </span>
                      {changed && (
                        <span
                          className="flex items-center gap-1 font-black"
                          style={{ color: next > item.price ? "#34d399" : "#fbbf24" }}
                        >
                          → {next}
                        </span>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="glass rounded-[26px] p-5 md:p-6">
              <SectionHeader title="Правило" className="mb-3" />
              <Tabs
                tabs={[
                  { key: "percent", label: "%", icon: Percent },
                  { key: "absolute", label: "±R$", icon: Plus },
                  { key: "set", label: "=", icon: Equal },
                  { key: "reset", label: "Сброс", icon: RotateCcw },
                ]}
                value={mode}
                onChange={(k) => setMode(k as typeof mode)}
                className="mb-4"
              />

              {mode !== "reset" && (
                <div className="chip mb-3 flex items-center gap-3 rounded-2xl px-4 py-3">
                  <span className="text-sm text-white/55">
                    {mode === "percent" ? "Процент" : mode === "absolute" ? "Изменить на" : "Новая цена"}
                  </span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="ml-auto w-24 rounded-lg bg-black/25 px-3 py-1.5 text-right text-sm font-bold outline-none"
                  />
                </div>
              )}

              <div className="chip mb-4 flex items-center gap-3 rounded-2xl px-4 py-3">
                <span className="text-sm text-white/55">Округлять до</span>
                <select
                  value={roundTo}
                  onChange={(e) => setRoundTo(Number(e.target.value))}
                  className="ml-auto cursor-pointer rounded-lg bg-black/25 px-3 py-1.5 text-sm font-bold outline-none"
                >
                  {[1, 5, 10, 25, 50, 100].map((v) => (
                    <option key={v} value={v} className="bg-[#0d0d17]">
                      {v} R$
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => {
                      setMode(p.mode as typeof mode);
                      setValue(p.value);
                      setReason(p.label);
                    }}
                    className="chip flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition hover:border-white/25"
                  >
                    <Sparkles className="size-3" style={{ color: "var(--acc2)" }} /> {p.label}
                  </button>
                ))}
              </div>

              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Причина (в историю)"
                className="chip mb-4 h-11 w-full rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/30"
              />

              {selected.size > 0 && (
                <div className="mb-4 rounded-2xl bg-white/5 p-3.5 text-sm">
                  <p className="flex items-center justify-between">
                    <span className="text-white/50">Предметов</span>
                    <strong>{selected.size}</strong>
                  </p>
                  <p className="mt-1.5 flex items-center justify-between">
                    <span className="text-white/50">Суммарно к цене</span>
                    <strong
                      className="flex items-center gap-1"
                      style={{ color: deltaRevenue >= 0 ? "#34d399" : "#fbbf24" }}
                    >
                      {deltaRevenue >= 0 ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                      {deltaRevenue >= 0 ? "+" : ""}
                      {fmtFull(deltaRevenue)} R$
                    </strong>
                  </p>
                </div>
              )}

              <button
                onClick={apply}
                disabled={busy || !selected.size}
                className="btn-acc shine flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold disabled:opacity-50"
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <Tags className="size-4" />}
                Применить к {selected.size} предм.
              </button>
              {result && <p className="mt-3 text-center text-sm text-emerald-300">{result}</p>}
            </div>

            <div className="glass rounded-[26px] p-5 md:p-6">
              <h2 className="font-display mb-3 flex items-center gap-2 text-base font-bold">
                <History className="size-4" style={{ color: "var(--acc2)" }} /> Журнал изменений
              </h2>
              {!data?.history.length ? (
                <p className="text-sm text-white/40">Изменений пока не было</p>
              ) : (
                <div className="no-scrollbar max-h-72 space-y-2 overflow-y-auto pr-1">
                  {data.history.map((h) => (
                    <div key={h.id} className="rounded-xl bg-white/4 p-2.5 text-xs">
                      <p className="truncate font-semibold">{h.name}</p>
                      <p className="mt-0.5 flex items-center gap-1.5 text-white/45">
                        <span className="line-through">{h.oldPrice}</span>
                        <span style={{ color: h.newPrice > h.oldPrice ? "#34d399" : "#fbbf24" }}>
                          → {h.newPrice} R$
                        </span>
                        {h.reason && <span className="truncate text-white/30">· {h.reason}</span>}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </Page>
  );
}

export const _icon = BarChart3;
