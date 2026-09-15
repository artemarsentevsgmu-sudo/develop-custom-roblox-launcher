"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, BadgePercent, CreditCard, Gift, ShieldCheck, Sparkles } from "lucide-react";
import { Page, SmartImage } from "@/components/ui";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";

const PACKS = [
  { robux: 400, price: "$4.99" },
  { robux: 800, price: "$9.99" },
  { robux: 1700, price: "$19.99" },
  { robux: 4500, price: "$49.99" },
  { robux: 10000, price: "$99.99" },
  { robux: 22500, price: "$199.99" },
];

export default function RobuxPage() {
  usePageTitle("Robux");
  return (
    <Page className="space-y-10">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10">
        <SmartImage src="/media/robux.jpg" alt="" className="absolute inset-0 size-full object-cover" eager />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07070d] via-[#07070d]/60 to-transparent" />
        <div className="relative max-w-2xl p-8 md:p-14">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display flex items-center gap-2 text-[11px] tracking-[0.3em] text-white/50 uppercase"
          >
            <RobuxIcon className="size-4" style={{ color: "var(--acc2)" }} /> Currency
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-display mt-4 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl"
          >
            <span className="text-gradient">Robux</span> — топливо метавселенной
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-4 max-w-lg text-white/60"
          >
            Смотрите номиналы прямо здесь, а покупайте на официальном сайте — безопасно и в один клик из карточки.
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            href="https://www.roblox.com/upgrades/robux"
            target="_blank"
            rel="noreferrer"
            className="btn-acc shine mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold"
          >
            Купить на roblox.com <ArrowUpRight className="size-5" />
          </motion.a>
        </div>
      </section>

      <section>
        <h2 className="font-display mb-5 text-xl font-bold">Номиналы</h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {PACKS.map((p, i) => (
            <motion.a
              key={p.robux}
              href="https://www.roblox.com/upgrades/robux"
              target="_blank"
              rel="noreferrer"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="card-hover shine group relative overflow-hidden rounded-[22px] border border-white/10 bg-white/4 p-6"
            >
              <RobuxIcon className="absolute -right-5 -bottom-6 size-28 rotate-12 text-white/6 transition-transform duration-700 group-hover:rotate-45" />
              <p className="flex items-center gap-2.5">
                <RobuxIcon className="size-7" style={{ color: "var(--acc2)" }} />
                <span className="font-display text-3xl font-black">{p.robux.toLocaleString("ru-RU")}</span>
              </p>
              <p className="mt-2 text-sm text-white/45">комплект Robux</p>
              <p className="mt-5 flex items-center justify-between">
                <span className="font-display text-lg font-bold">{p.price}</span>
                <span className="flex items-center gap-1 text-xs font-semibold text-white/40 transition group-hover:text-white">
                  <CreditCard className="size-3.5" /> на сайте
                </span>
              </p>
            </motion.a>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="glass card-hover rounded-[26px] p-7">
          <Gift className="size-8" style={{ color: "var(--acc3)" }} />
          <h3 className="font-display mt-4 text-lg font-bold">Подарочные карты</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Цифровые и физические карты Roblox активируются на странице погашения. Часто вместе с картой дарят
            эксклюзивный предмет месяца.
          </p>
          <a
            href="https://www.roblox.com/giftcards"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost mt-5 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            Активировать карту <ArrowUpRight className="size-4" />
          </a>
        </div>
        <Link href="/premium" className="glass card-hover shine group relative block overflow-hidden rounded-[26px] p-7">
          <BadgePercent className="size-8" style={{ color: "var(--acc2)" }} />
          <h3 className="font-display mt-4 text-lg font-bold">+10% с Premium</h3>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            Подписчики Premium получают модификатор ×1.1 к каждому комплекту робуксов и ежемесячную выплату.
            Считайте выгоду заранее.
          </p>
          <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: "var(--acc2)" }}>
            Сравнить тарифы <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </Link>
      </section>

      <div className="glass flex items-start gap-3 rounded-3xl p-5 text-sm text-white/50">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-400" />
        <p className="leading-relaxed">
          Все цены — ориентировочные USD-рекомендации Roblox; точная сумма в вашей валюте показывается при оплате на
          roblox.com. RoLaunch никогда не просит логин и не принимает платежи.
          <Sparkles className="ml-1.5 inline size-4" style={{ color: "var(--acc2)" }} />
        </p>
      </div>
    </Page>
  );
}
