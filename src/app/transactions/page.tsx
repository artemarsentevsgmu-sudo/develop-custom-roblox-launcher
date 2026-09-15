"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  FileSpreadsheet,
  FileText,
  Receipt,
} from "lucide-react";
import { useFetch } from "@/lib/client";
import { cx, fmtCompact, fmtFull } from "@/lib/shared";
import { CountUp, ErrorView, LoaderView, Page, Tabs } from "@/components/ui";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";

interface Tx {
  id: number;
  happenedAt: string;
  kind: string;
  title: string;
  counterparty: string | null;
  amount: number;
  balanceAfter: number;
}

const KINDS = [
  { key: "all", label: "Все" },
  { key: "Sale", label: "Продажи" },
  { key: "Payout", label: "Выплаты" },
  { key: "Purchase", label: "Расходы" },
];

export default function TransactionsPage() {
  usePageTitle("История транзакций");
  const [kind, setKind] = useState("all");
  const { data, error, loading, reload } = useFetch<{
    rows: Tx[];
    summary: { balance: number; byKind: { kind: string; total: number; count: number }[] };
  }>(`/api/workspace/transactions?kind=${kind}&limit=200`, [kind]);

  const printPdf = () => window.print();

  return (
    <Page className="space-y-7">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Ledger</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            История <span className="text-gradient">транзакций</span>
          </h1>
          <p className="mt-2 text-sm text-white/45">Все движения робуксов с экспортом в Excel и PDF</p>
        </div>
        <div className="flex flex-wrap gap-2.5 print:hidden">
          <a
            href={`/api/workspace/transactions?kind=${kind}&format=csv`}
            className="btn-acc shine flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          >
            <FileSpreadsheet className="size-4" /> Excel (CSV)
          </a>
          <button
            onClick={printPdf}
            className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <FileText className="size-4" /> PDF
          </button>
        </div>
      </header>

      {loading && !data ? (
        <LoaderView label="Читаем журнал…" />
      ) : error ? (
        <ErrorView message={error} onRetry={reload} />
      ) : data ? (
        <>
          <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            <div className="glass card-hover border-gradient relative overflow-hidden rounded-[22px] p-5">
              <p className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-white/40 uppercase">
                <Wallet className="size-3.5" /> Текущий баланс
              </p>
              <p className="font-display mt-2 flex items-center gap-2 text-2xl font-black">
                <RobuxIcon className="size-5" style={{ color: "var(--acc2)" }} />
                <CountUp value={data.summary.balance} compact={false} />
              </p>
            </div>
            {data.summary.byKind.slice(0, 3).map((k) => (
              <div key={k.kind} className="glass card-hover rounded-[22px] p-5">
                <p className="text-[11px] tracking-[0.18em] text-white/40 uppercase">{k.kind}</p>
                <p
                  className="font-display mt-2 text-2xl font-black"
                  style={{ color: k.total >= 0 ? "#34d399" : "#fb7185" }}
                >
                  {k.total >= 0 ? "+" : ""}
                  {fmtCompact(k.total)}
                </p>
                <p className="mt-0.5 text-xs text-white/40">{k.count} операций</p>
              </div>
            ))}
          </section>

          <div className="print:hidden">
            <Tabs tabs={KINDS} value={kind} onChange={setKind} />
          </div>

          <section className="glass overflow-hidden rounded-[26px]">
            <div className="hidden grid-cols-[150px_110px_1fr_130px_130px] gap-3 border-b border-white/8 px-5 py-3 text-[11px] tracking-wider text-white/40 uppercase md:grid">
              <span>Дата</span>
              <span>Тип</span>
              <span>Описание</span>
              <span className="text-right">Сумма</span>
              <span className="text-right">Баланс</span>
            </div>
            <div className="divide-y divide-white/6">
              {data.rows.map((t, i) => {
                const income = t.amount >= 0;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i, 20) * 0.015 }}
                    className="grid grid-cols-[1fr_auto] gap-3 px-5 py-3 transition hover:bg-white/4 md:grid-cols-[150px_110px_1fr_130px_130px] md:items-center"
                  >
                    <span className="text-xs text-white/50 md:text-sm">
                      {new Date(t.happenedAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="hidden md:block">
                      <span
                        className={cx(
                          "chip rounded-full px-2.5 py-1 text-[11px] font-semibold",
                          income ? "text-emerald-300" : "text-rose-300"
                        )}
                      >
                        {t.kind}
                      </span>
                    </span>
                    <span className="col-span-2 min-w-0 md:col-span-1">
                      <span className="block truncate text-sm">{t.title}</span>
                      {t.counterparty && (
                        <span className="block truncate text-xs text-white/35">{t.counterparty}</span>
                      )}
                    </span>
                    <span
                      className="flex items-center justify-end gap-1 text-sm font-bold"
                      style={{ color: income ? "#34d399" : "#fb7185" }}
                    >
                      {income ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                      {income ? "+" : ""}
                      {fmtFull(t.amount)}
                    </span>
                    <span className="hidden text-right text-sm text-white/55 md:block">
                      {fmtFull(t.balanceAfter)}
                    </span>
                  </motion.div>
                );
              })}
              {!data.rows.length && (
                <p className="p-10 text-center text-sm text-white/40">
                  <Receipt className="mx-auto mb-3 size-8 text-white/20" />
                  Операций этого типа пока нет
                </p>
              )}
            </div>
          </section>

          <p className="flex items-center gap-2 text-xs text-white/35 print:hidden">
            <Download className="size-3.5" />
            CSV открывается в Excel и Google Таблицах (UTF-8 с BOM, разделитель «;»). PDF — через печать страницы.
          </p>
        </>
      ) : null}
    </Page>
  );
}
