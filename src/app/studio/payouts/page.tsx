"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Search,
  Trash2,
  Plus,
  Send,
  Wallet,
  Percent,
  Equal,
  Coins,
  History,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  UserRound,
} from "lucide-react";
import { api, useFetch } from "@/lib/client";
import { cx, fmtCompact, fmtFull } from "@/lib/shared";
import { ErrorView, LoaderView, Page, SectionHeader, SmartImage, Tabs } from "@/components/ui";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";

interface Member {
  userId: number;
  username: string;
  displayName: string;
  role?: string;
  avatar: string | null;
}
interface Recipient extends Member {
  amount: number;
  percent: number;
}
interface PayoutRun {
  id: number;
  groupName: string | null;
  total: number;
  mode: string;
  note: string | null;
  entries: { username: string; amount: number }[];
  createdAt: string;
}

export default function PayoutsPage() {
  usePageTitle("Массовые выплаты");
  const [groupId, setGroupId] = useState("");
  const [groupName, setGroupName] = useState("");
  const [mode, setMode] = useState<"fixed" | "percent" | "equal">("percent");
  const [pool, setPool] = useState(10000);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [note, setNote] = useState("");

  const { data, error, loading, reload } = useFetch<{ runs: PayoutRun[]; balance: number }>(
    "/api/workspace/payouts"
  );
  const balance = data?.balance ?? 0;

  const [memberQuery, setMemberQuery] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const loadMembers = async () => {
    const gid = Number(memberQuery || groupId);
    if (!gid) return;
    setLoadingMembers(true);
    try {
      const r = await api<{ members: Member[] }>(`/api/roblox/group-members?groupId=${gid}&limit=40`);
      setMembers(r.members);
      setGroupId(String(gid));
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Не удалось получить участников" });
    }
    setLoadingMembers(false);
  };

  /* recompute amounts whenever mode / pool / recipients change */
  useEffect(() => {
    setRecipients((prev) => {
      if (!prev.length) return prev;
      if (mode === "equal") {
        const each = Math.floor(pool / prev.length);
        return prev.map((r) => ({ ...r, amount: each, percent: 100 / prev.length }));
      }
      if (mode === "percent") {
        const totalPct = prev.reduce((a, r) => a + (r.percent || 0), 0) || 1;
        return prev.map((r) => ({ ...r, amount: Math.floor((pool * (r.percent || 0)) / totalPct) }));
      }
      return prev;
    });
  }, [mode, pool, recipients.length]);

  const total = useMemo(() => recipients.reduce((a, r) => a + (r.amount || 0), 0), [recipients]);
  // With an empty ledger the launcher records a payout plan instead of blocking
  const planning = balance <= 0;
  const enough = planning || total <= balance;

  const add = (m: Member) => {
    if (recipients.some((r) => r.userId === m.userId)) return;
    setRecipients((prev) => [
      ...prev,
      { ...m, amount: mode === "equal" ? Math.floor(pool / (prev.length + 1)) : 0, percent: 10 },
    ]);
  };

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await api<{ balance: number }>("/api/workspace/payouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: Number(groupId) || undefined,
          groupName: groupName || undefined,
          mode,
          note,
          entries: recipients.map((x) => ({
            userId: x.userId,
            username: x.username,
            role: x.role,
            amount: x.amount,
            percent: x.percent,
          })),
        }),
      });
      setMsg({ kind: "ok", text: `Выплата проведена · остаток ${fmtFull(r.balance)} R$` });
      setRecipients([]);
      reload();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "Ошибка выплаты" });
    }
    setBusy(false);
  };

  return (
    <Page className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Group payouts</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Массовые <span className="text-gradient">выплаты</span>
          </h1>
          <p className="mt-2 text-sm text-white/45">Распределение средств между участниками группы</p>
        </div>
        <div className="glass flex items-center gap-3 rounded-2xl px-5 py-3">
          <Wallet className="size-5" style={{ color: "var(--acc2)" }} />
          <div>
            <p className="text-[11px] tracking-wider text-white/40 uppercase">
              {balance > 0 ? "Баланс леджера" : "Режим планирования"}
            </p>
            <p className="font-display flex items-center gap-1.5 text-xl font-black">
              <RobuxIcon className="size-4" style={{ color: "var(--acc2)" }} />
              {fmtFull(balance)}
            </p>
          </div>
        </div>
      </header>

      {loading && !data ? (
        <LoaderView label="Загружаем историю выплат…" />
      ) : error ? (
        <ErrorView message={error} onRetry={reload} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          <div className="space-y-5">
            {/* member picker */}
            <section className="glass rounded-[26px] p-5 md:p-6">
              <SectionHeader title="Участники группы" hint="Введите ID группы Roblox — подтянем реальный состав" />
              <div className="flex flex-col gap-2.5 sm:flex-row">
                <div className="chip flex flex-1 items-center gap-2.5 rounded-2xl px-4">
                  <Users className="size-4 shrink-0 text-white/40" />
                  <input
                    value={memberQuery}
                    onChange={(e) => setMemberQuery(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && loadMembers()}
                    placeholder="ID группы, например 7"
                    className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
                  />
                </div>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Название (для истории)"
                  className="chip h-11 rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/30 sm:w-52"
                />
                <button
                  onClick={loadMembers}
                  disabled={loadingMembers || !memberQuery}
                  className="btn-acc shine flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold disabled:opacity-50"
                >
                  {loadingMembers ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
                  Найти
                </button>
              </div>

              {members.length > 0 && (
                <div className="no-scrollbar mt-4 max-h-56 space-y-1 overflow-y-auto pr-1">
                  {members.map((m) => {
                    const picked = recipients.some((r) => r.userId === m.userId);
                    return (
                      <button
                        key={m.userId}
                        onClick={() => add(m)}
                        disabled={picked}
                        className={cx(
                          "flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition",
                          picked ? "opacity-40" : "cursor-pointer hover:bg-white/6"
                        )}
                      >
                        {m.avatar ? (
                          <SmartImage src={m.avatar} alt="" className="size-9 rounded-full" />
                        ) : (
                          <span className="grid size-9 place-items-center rounded-full bg-white/8">
                            <UserRound className="size-4" />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{m.displayName}</span>
                          <span className="block truncate text-xs text-white/40">
                            @{m.username}
                            {m.role ? ` · ${m.role}` : ""}
                          </span>
                        </span>
                        {!picked && <Plus className="size-4 shrink-0 text-white/35" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* distribution */}
            <section className="glass rounded-[26px] p-5 md:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <SectionHeader title={`Получатели · ${recipients.length}`} className="mb-0" />
                <Tabs
                  tabs={[
                    { key: "percent", label: "Проценты", icon: Percent },
                    { key: "equal", label: "Поровну", icon: Equal },
                    { key: "fixed", label: "Вручную", icon: Coins },
                  ]}
                  value={mode}
                  onChange={(k) => setMode(k as typeof mode)}
                />
              </div>

              {mode !== "fixed" && (
                <div className="chip mb-4 flex items-center gap-3 rounded-2xl px-4 py-3">
                  <RobuxIcon className="size-4 shrink-0" style={{ color: "var(--acc2)" }} />
                  <span className="text-sm text-white/55">Общий фонд</span>
                  <input
                    type="number"
                    min={0}
                    value={pool}
                    onChange={(e) => setPool(Math.max(0, Number(e.target.value)))}
                    className="ml-auto w-32 rounded-lg bg-black/25 px-3 py-1.5 text-right text-sm font-bold outline-none"
                  />
                </div>
              )}

              {recipients.length === 0 ? (
                <p className="rounded-2xl bg-white/4 p-6 text-center text-sm text-white/45">
                  Добавьте участников из списка выше
                </p>
              ) : (
                <div className="space-y-2">
                  {recipients.map((r, i) => (
                    <motion.div
                      key={r.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 rounded-2xl bg-white/4 p-3"
                    >
                      {r.avatar ? (
                        <SmartImage src={r.avatar} alt="" className="size-9 shrink-0 rounded-full" />
                      ) : (
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white/8">
                          <UserRound className="size-4" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{r.displayName}</span>
                        <span className="block truncate text-xs text-white/40">@{r.username}</span>
                      </span>
                      {mode === "percent" && (
                        <span className="flex items-center gap-1">
                          <input
                            type="number"
                            min={0}
                            value={r.percent}
                            onChange={(e) => {
                              const v = Math.max(0, Number(e.target.value));
                              setRecipients((prev) =>
                                prev.map((x, ix) => (ix === i ? { ...x, percent: v } : x))
                              );
                            }}
                            className="w-16 rounded-lg bg-black/25 px-2 py-1.5 text-right text-sm outline-none"
                          />
                          <Percent className="size-3 text-white/35" />
                        </span>
                      )}
                      {mode === "fixed" ? (
                        <input
                          type="number"
                          min={0}
                          value={r.amount}
                          onChange={(e) => {
                            const v = Math.max(0, Number(e.target.value));
                            setRecipients((prev) => prev.map((x, ix) => (ix === i ? { ...x, amount: v } : x)));
                          }}
                          className="w-24 rounded-lg bg-black/25 px-2 py-1.5 text-right text-sm font-bold outline-none"
                        />
                      ) : (
                        <span className="w-24 text-right text-sm font-bold">{fmtFull(r.amount)}</span>
                      )}
                      <button
                        onClick={() => setRecipients((prev) => prev.filter((x) => x.userId !== r.userId))}
                        className="cursor-pointer text-white/30 transition hover:text-rose-400"
                        aria-label="Убрать"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}

              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Комментарий к выплате (необязательно)"
                className="chip mt-4 h-11 w-full rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/30"
              />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
                <div>
                  <p className="text-xs tracking-wider text-white/40 uppercase">К выплате</p>
                  <p
                    className="font-display flex items-center gap-1.5 text-2xl font-black"
                    style={{ color: enough ? undefined : "#fb7185" }}
                  >
                    <RobuxIcon className="size-5" style={{ color: "var(--acc2)" }} />
                    {fmtFull(total)}
                  </p>
                  {!enough && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-rose-300">
                      <AlertTriangle className="size-3.5" /> Превышает баланс на {fmtFull(total - balance)} R$
                    </p>
                  )}
                </div>
                <button
                  onClick={submit}
                  disabled={busy || !recipients.length || !enough || total <= 0}
                  className="btn-acc shine flex cursor-pointer items-center gap-2.5 rounded-2xl px-7 py-3.5 text-base font-bold disabled:opacity-50"
                >
                  {busy ? <Loader2 className="size-5 animate-spin" /> : <Send className="size-5" />}
                  Провести выплату
                </button>
              </div>

              {msg && (
                <p
                  className={cx(
                    "mt-3 flex items-center gap-2 rounded-xl p-3 text-sm",
                    msg.kind === "ok"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-rose-400/10 text-rose-300"
                  )}
                >
                  {msg.kind === "ok" ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                  {msg.text}
                </p>
              )}
            </section>
          </div>

          {/* history */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="glass rounded-[26px] p-5 md:p-6">
              <h2 className="font-display mb-4 flex items-center gap-2 text-lg font-bold">
                <History className="size-4.5" style={{ color: "var(--acc2)" }} /> История выплат
              </h2>
              {!data?.runs.length ? (
                <p className="rounded-2xl bg-white/4 p-5 text-center text-sm text-white/45">
                  Выплат ещё не было
                </p>
              ) : (
                <div className="no-scrollbar max-h-[560px] space-y-2.5 overflow-y-auto pr-1">
                  {data.runs.map((run) => (
                    <div key={run.id} className="rounded-2xl bg-white/4 p-4">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold">{run.groupName || "Без группы"}</p>
                        <p className="font-display shrink-0 text-sm font-black" style={{ color: "var(--acc2)" }}>
                          {fmtCompact(run.total)} R$
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-white/40">
                        {run.entries.length} получателей · {run.mode} ·{" "}
                        {new Date(run.createdAt).toLocaleDateString("ru-RU")}
                      </p>
                      {run.note && <p className="mt-1.5 line-clamp-2 text-xs text-white/50">{run.note}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {run.entries.slice(0, 5).map((e, i) => (
                          <span key={i} className="chip rounded-full px-2 py-0.5 text-[10px]">
                            {e.username} · {fmtCompact(e.amount)}
                          </span>
                        ))}
                        {run.entries.length > 5 && (
                          <span className="chip rounded-full px-2 py-0.5 text-[10px] text-white/40">
                            +{run.entries.length - 5}
                          </span>
                        )}
                      </div>
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
