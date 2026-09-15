"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  Eye,
  Heart,
  ThumbsUp,
  Gamepad2,
  ShieldAlert,
  Coins,
  Info,
  RefreshCw,
  Loader2,
  BarChart3,
} from "lucide-react";
import { api, useLocal } from "@/lib/client";
import { cx, fmtCompact, fmtFull, type GameSummary } from "@/lib/shared";
import { CountUp, EmptyState, Page, SectionHeader, SmartImage } from "@/components/ui";
import { BarChart, Donut } from "@/components/charts";
import { GroupPicker, type SelectedGroup } from "@/components/group-picker";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";
import { useStore } from "@/components/store";

interface GroupAnalytics {
  group: { id: number; name: string; icon: string | null; memberCount: number };
  access: { userId: number; username: string; roleName: string; rank: number };
  games: GameSummary[];
  totals: { playing: number; visits: number; favorites: number; upVotes: number; downVotes: number; games: number };
  rating: number | null;
  topByPlaying: GameSummary[];
  topByVisits: GameSummary[];
  roles: { id: number; name: string; rank: number; memberCount: number }[];
  revenue: {
    available: boolean;
    reason?: string;
    funds?: number;
    summary?: {
      recurringRobuxStipend: number;
      itemSaleRobux: number;
      purchasedRobux: number;
      tradeSystemRobux: number;
      groupPayoutRobux: number;
      total: number;
    };
  };
}

export default function AnalyticsPage() {
  usePageTitle("Статистика группы");
  const { settings } = useStore();
  const [group, setGroup] = useLocal<SelectedGroup | null>("rolaunch.group", null);
  const [data, setData] = useState<GroupAnalytics | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = async (g: SelectedGroup) => {
    setBusy(true);
    setErr(null);
    try {
      const r = await api<GroupAnalytics>(
        `/api/workspace/group-analytics?groupId=${g.id}&user=${encodeURIComponent(g.username)}`,
        settings.cookie ? { headers: { "x-rbx-cookie": settings.cookie } } : undefined
      );
      setData(r);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не удалось получить статистику");
      setData(null);
    }
    setBusy(false);
  };

  useEffect(() => {
    if (group) void load(group);
    else setData(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group?.id, group?.username]);

  return (
    <Page className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Group analytics</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Статистика <span className="text-gradient">группы</span>
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Живые данные Roblox по мирам группы · доступ только с ранга 254+
          </p>
        </div>
        {group && (
          <button
            onClick={() => load(group)}
            disabled={busy}
            className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className={cx("size-4", busy && "animate-spin")} /> Обновить
          </button>
        )}
      </header>

      <GroupPicker value={group} onChange={setGroup} />

      {err && (
        <p className="flex items-start gap-2.5 rounded-2xl border border-rose-400/25 bg-rose-400/8 p-4 text-sm text-rose-200">
          <ShieldAlert className="mt-0.5 size-4.5 shrink-0" /> {err}
        </p>
      )}

      {busy && !data && (
        <div className="flex items-center justify-center gap-3 py-16 text-white/45">
          <Loader2 className="size-5 animate-spin" /> Собираем статистику группы…
        </div>
      )}

      {!group && !busy && (
        <EmptyState
          icon={BarChart3}
          title="Группа не выбрана"
          hint="Введите свой ник выше — покажем группы, где у вас ранг 254 и выше"
        />
      )}

      {data && (
        <>
          <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi icon={Users} label="Участников" value={data.group.memberCount} />
            <Kpi icon={Gamepad2} label="Онлайн сейчас" value={data.totals.playing} accent />
            <Kpi icon={Eye} label="Визитов всего" value={data.totals.visits} />
            <Kpi icon={Heart} label="В избранном" value={data.totals.favorites} />
            <Kpi
              icon={ThumbsUp}
              label="Рейтинг"
              raw={data.rating != null ? `${data.rating}%` : "—"}
              hint={`${fmtCompact(data.totals.upVotes + data.totals.downVotes)} оценок`}
            />
          </section>

          {/* revenue block — real or honest unavailable */}
          <section className="glass rounded-[26px] p-5 md:p-6">
            <SectionHeader
              title="Финансы группы"
              hint="Доход отдаётся Roblox только авторизованной сессии с правом «Просмотр финансов»"
              className="mb-4"
            />
            {data.revenue.available ? (
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
                {typeof data.revenue.funds === "number" && (
                  <div className="border-gradient rounded-[22px] p-5">
                    <p className="text-[11px] tracking-[0.18em] text-white/40 uppercase">Баланс группы</p>
                    <p className="font-display mt-2 flex items-center gap-2 text-2xl font-black">
                      <RobuxIcon className="size-5" style={{ color: "var(--acc2)" }} />
                      <CountUp value={data.revenue.funds} compact={false} />
                    </p>
                  </div>
                )}
                {data.revenue.summary && (
                  <>
                    <Kpi icon={Coins} label="Продажи вещей / мес" value={data.revenue.summary.itemSaleRobux} />
                    <Kpi icon={Coins} label="Выплаты / мес" value={Math.abs(data.revenue.summary.groupPayoutRobux)} />
                    <Kpi icon={Coins} label="Итого за месяц" value={data.revenue.summary.total} accent />
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/8 p-4">
                <Info className="mt-0.5 size-4.5 shrink-0 text-amber-400" />
                <div className="text-sm text-white/65">
                  <p className="font-semibold text-amber-200">Финансовые данные недоступны</p>
                  <p className="mt-1 text-xs leading-relaxed">{data.revenue.reason}</p>
                  <Link href="/settings" className="mt-2 inline-block text-xs font-semibold underline">
                    Настроить вход в аккаунт →
                  </Link>
                </div>
              </div>
            )}
          </section>

          {data.games.length > 0 ? (
            <>
              <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
                <div className="glass rounded-[26px] p-5 md:p-6">
                  <SectionHeader title="Миры группы по онлайну" hint="Кто сейчас держит игроков" />
                  <div className="space-y-2">
                    {data.topByPlaying.map((g, i) => (
                      <motion.div
                        key={g.universeId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Link
                          href={`/game/${g.universeId}`}
                          className="flex items-center gap-3 rounded-2xl p-2.5 transition hover:bg-white/5"
                        >
                          <span className="font-display w-5 shrink-0 text-center text-sm font-black text-white/35">
                            {i + 1}
                          </span>
                          <SmartImage src={g.iconUrl} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-bold">{g.name}</span>
                            <span className="flex items-center gap-2 text-xs text-white/45">
                              <span>{fmtCompact(g.visits)} визитов</span>
                              {g.rating != null && <span className="text-emerald-300">{g.rating}%</span>}
                            </span>
                          </span>
                          <span className="shrink-0 text-right">
                            <span className="font-display block text-sm font-bold">{fmtCompact(g.playing)}</span>
                            <span className="block text-[10px] text-white/35">онлайн</span>
                          </span>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="glass rounded-[26px] p-5 md:p-6">
                    <h2 className="font-display mb-4 text-base font-bold">Визиты по мирам</h2>
                    <Donut
                      slices={data.topByVisits.slice(0, 6).map((g) => ({ label: g.name, value: g.visits }))}
                      size={150}
                    />
                  </div>
                  <div className="glass rounded-[26px] p-5 md:p-6">
                    <h2 className="font-display mb-4 text-base font-bold">Онлайн по мирам</h2>
                    <BarChart
                      data={data.topByPlaying
                        .slice(0, 10)
                        .map((g) => ({ label: g.name.slice(0, 8), value: g.playing }))}
                      height={150}
                    />
                  </div>
                </div>
              </section>

              <section className="glass rounded-[26px] p-5 md:p-6">
                <SectionHeader title="Состав по рангам" hint="Роли группы и число участников" />
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {data.roles.slice(0, 12).map((r) => (
                    <div key={r.id} className="flex items-center gap-2.5 rounded-xl bg-white/4 p-2.5 text-sm">
                      <span
                        className={cx(
                          "chip w-12 shrink-0 rounded px-1.5 py-0.5 text-center font-mono text-xs",
                          r.rank >= 254 && "text-emerald-300"
                        )}
                      >
                        {r.rank}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{r.name}</span>
                      <span className="shrink-0 font-semibold">{fmtFull(r.memberCount)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <EmptyState
              icon={Gamepad2}
              title="У группы нет публичных миров"
              hint="Статистика по играм появится, как только группа опубликует хотя бы один мир"
            />
          )}
        </>
      )}
    </Page>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  raw,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  label: string;
  value?: number;
  raw?: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className={cx("glass card-hover relative overflow-hidden rounded-[22px] p-5", accent && "border-gradient")}
    >
      <p className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-white/40 uppercase">
        <Icon className="size-3.5" /> {label}
      </p>
      <p className="font-display mt-2 text-2xl font-black">
        {raw ?? <CountUp value={value ?? 0} />}
      </p>
      {hint && <p className="mt-1 text-xs text-white/40">{hint}</p>}
    </motion.div>
  );
}
