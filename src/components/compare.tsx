"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  Search,
  Loader2,
  ChevronDown,
  TrendingDown,
  TrendingUp,
  Target,
  Eye,
  Heart,
  Crown,
} from "lucide-react";
import { api } from "@/lib/client";
import { cx, fmtCompact } from "@/lib/shared";
import { SmartImage } from "@/components/ui";
import { RobuxIcon } from "@/components/icons";

interface CompareData {
  keyword: string;
  count: number;
  stats: { min: number; p25: number; median: number; p75: number; max: number; avg: number };
  position: {
    myPrice: number;
    cheaperThanMine: number;
    percentile: number;
    verdict: string;
  } | null;
  competitors: {
    id: number;
    name: string;
    price: number | null;
    thumb: string | null;
    type: string;
    favorites: number;
    limited: boolean;
  }[];
}

const VERDICT_STYLE: Record<string, { color: string; icon: typeof TrendingUp }> = {
  "выше рынка": { color: "#fb7185", icon: TrendingUp },
  "ниже рынка": { color: "#34d399", icon: TrendingDown },
  "в рынке": { color: "var(--acc2)", icon: Target },
  "нет данных": { color: "#94a3b8", icon: Target },
};

export function ComparePanel({
  initialKeyword,
  category,
}: {
  initialKeyword?: string;
  category?: string;
}) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState(initialKeyword ?? "");
  const [price, setPrice] = useState("");
  const [data, setData] = useState<CompareData | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const run = async () => {
    const k = keyword.trim();
    if (!k) {
      setErr("Введите название предмета для сравнения");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      const params = new URLSearchParams({ keyword: k });
      if (price) params.set("price", price);
      if (category) params.set("category", category);
      setData(await api<CompareData>(`/api/roblox/compare?${params}`));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не удалось сравнить");
    }
    setBusy(false);
  };

  const verdict = data?.position ? VERDICT_STYLE[data.position.verdict] ?? VERDICT_STYLE["в рынке"] : null;
  const VerdictIcon = verdict?.icon ?? Target;

  return (
    <section className="glass overflow-hidden rounded-[26px]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 p-5 text-left transition hover:bg-white/4"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: "var(--acc-soft)" }}>
          <BarChart3 className="size-5" style={{ color: "var(--acc2)" }} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-display block font-bold">Сравнение с конкурентами</span>
          <span className="block text-sm text-white/45">
            Мониторинг цен на похожие предметы маркетплейса
          </span>
        </span>
        <ChevronDown className={cx("size-5 shrink-0 text-white/40 transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 p-5">
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="chip flex flex-1 items-center gap-2.5 rounded-2xl px-4">
                  <Search className="size-4 shrink-0 text-white/40" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && run()}
                    placeholder="Например: wings, halo, hair…"
                    className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                  />
                </div>
                <div className="chip flex items-center gap-2 rounded-2xl px-4 sm:w-48">
                  <RobuxIcon className="size-4 shrink-0" style={{ color: "var(--acc2)" }} />
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))}
                    placeholder="Моя цена"
                    className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                  />
                </div>
                <button
                  onClick={run}
                  disabled={busy}
                  className="btn-acc shine flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
                  Анализ
                </button>
              </div>
              {err && <p className="mt-3 text-sm text-rose-300">{err}</p>}

              {data && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-5 space-y-5">
                  {/* price distribution */}
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs text-white/45">
                      <span>Разброс цен по {data.count} похожим предметам</span>
                      <span>среднее {fmtCompact(data.stats.avg)} R$</span>
                    </div>
                    <div className="relative h-14">
                      <div className="absolute inset-x-0 top-5 h-3 overflow-hidden rounded-full bg-white/8">
                        <div
                          className="absolute inset-y-0 rounded-full"
                          style={{
                            left: `${(data.stats.p25 / (data.stats.max || 1)) * 100}%`,
                            width: `${((data.stats.p75 - data.stats.p25) / (data.stats.max || 1)) * 100}%`,
                            background: "linear-gradient(90deg, var(--acc1), var(--acc2))",
                            opacity: 0.85,
                          }}
                        />
                      </div>
                      {[
                        { v: data.stats.min, l: "мин" },
                        { v: data.stats.median, l: "медиана" },
                        { v: data.stats.max, l: "макс" },
                      ].map((m) => (
                        <div
                          key={m.l}
                          className="absolute top-0 -translate-x-1/2 text-center"
                          style={{ left: `${Math.min(97, Math.max(3, (m.v / (data.stats.max || 1)) * 100))}%` }}
                        >
                          <span className="block text-[10px] text-white/40">{m.l}</span>
                          <span className="block text-xs font-bold">{m.v}</span>
                        </div>
                      ))}
                      {data.position && (
                        <div
                          className="absolute top-3.5 -translate-x-1/2"
                          style={{
                            left: `${Math.min(98, Math.max(2, (data.position.myPrice / (data.stats.max || 1)) * 100))}%`,
                          }}
                        >
                          <span className="block size-6 rounded-full border-4 border-[#07070d]" style={{ background: "#fbbf24" }} />
                          <span className="mt-1 block text-center text-[10px] font-bold whitespace-nowrap text-amber-300">
                            вы · {data.position.myPrice}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {data.position && verdict && (
                    <div className="flex flex-wrap gap-2.5">
                      <span
                        className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold"
                        style={{ color: verdict.color }}
                      >
                        <VerdictIcon className="size-4" /> Ваша цена {data.position.verdict}
                      </span>
                      <span className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm">
                        <Eye className="size-4 text-white/40" />
                        дешевле вас: <strong>{data.position.cheaperThanMine}</strong> из {data.count}
                      </span>
                      <span className="chip flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm">
                        перцентиль <strong>{data.position.percentile}%</strong>
                      </span>
                    </div>
                  )}

                  <div>
                    <p className="mb-2.5 text-xs tracking-[0.2em] text-white/40 uppercase">
                      Конкуренты по возрастанию цены
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                      {data.competitors.map((c) => (
                        <a
                          key={c.id}
                          href={`https://www.roblox.com/catalog/${c.id}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="card-hover flex items-center gap-3 rounded-2xl bg-white/4 p-2.5"
                        >
                          <SmartImage src={c.thumb} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">{c.name}</span>
                            <span className="flex items-center gap-2 text-[11px] text-white/40">
                              <span className="flex items-center gap-0.5">
                                <Heart className="size-2.5" /> {fmtCompact(c.favorites)}
                              </span>
                              {c.limited && (
                                <span className="flex items-center gap-0.5 text-amber-300">
                                  <Crown className="size-2.5" /> limited
                                </span>
                              )}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-1 text-sm font-bold">
                            <RobuxIcon className="size-3.5" style={{ color: "var(--acc2)" }} />
                            {c.price}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
