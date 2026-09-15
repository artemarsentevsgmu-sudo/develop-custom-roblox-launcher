"use client";

import { motion } from "framer-motion";
import { Check, Gem, ArrowUpRight, Gift, RefreshCcw, ShoppingBag, TrendingUp } from "lucide-react";
import { Page, SmartImage } from "@/components/ui";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";
import { cx } from "@/lib/shared";

const TIERS = [
  {
    name: "Premium 450",
    robux: 450,
    price: "$4.99",
    hint: "пробный шаг",
    popular: false,
  },
  {
    name: "Premium 1000",
    robux: 1000,
    price: "$9.99",
    hint: "выбор большинства",
    popular: true,
  },
  {
    name: "Premium 2200",
    robux: 2200,
    price: "$19.99",
    hint: "максимум выгоды",
    popular: false,
  },
];

const PERKS = [
  { icon: RobuxInline, text: "Ежемесячные робуксы — начисляются автоматически" },
  { icon: TrendingUp, text: "Бонус 10% к каждой покупке робуксов" },
  { icon: RefreshCcw, text: "Трейд лимитедов с другими премиум-игроками" },
  { icon: ShoppingBag, text: "Больше робуксов с продажи своих вещей" },
  { icon: Gift, text: "Эксклюзивные предметы только для подписчиков" },
];

function RobuxInline({ className }: { className?: string }) {
  return <RobuxIcon className={className} />;
}

export default function PremiumPage() {
  usePageTitle("Roblox Premium");
  return (
    <Page className="space-y-10">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10">
        <SmartImage src="/media/premium.jpg" alt="" className="absolute inset-0 size-full object-cover" eager />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07070d] via-[#07070d]/65 to-transparent" />
        <div className="relative max-w-2xl p-8 md:p-14">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display flex items-center gap-2 text-[11px] tracking-[0.3em] text-white/50 uppercase"
          >
            <Gem className="size-4" style={{ color: "var(--acc3)" }} /> Membership
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-display mt-4 text-4xl leading-[1.04] font-bold tracking-tight md:text-5xl"
          >
            Roblox <span className="text-gradient">Premium</span> — больше метавселенной
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-4 max-w-lg text-white/60"
          >
            Ежемесячные робуксы, приоритетная экономика и эксклюзивный контент. Подписка оформляется на
            официальном сайте Roblox — мы просто помогаем выбрать тариф.
          </motion.p>
          <motion.a
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            href="https://www.roblox.com/premium/membership"
            target="_blank"
            rel="noreferrer"
            className="btn-acc shine mt-8 inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold"
          >
            Оформить на roblox.com <ArrowUpRight className="size-5" />
          </motion.a>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {TIERS.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={cx(
              "card-hover shine relative overflow-hidden rounded-[26px] border p-7",
              t.popular ? "border-transparent" : "border-white/10 bg-white/4"
            )}
            style={
              t.popular
                ? {
                    background:
                      "linear-gradient(#101018, #101018) padding-box, linear-gradient(140deg, var(--acc1), var(--acc3)) border-box",
                    border: "1px solid transparent",
                  }
                : undefined
            }
          >
            {t.popular && (
              <span className="chip-acc absolute top-4 right-4 rounded-full px-3 py-1 text-[11px] font-bold">
                ПОПУЛЯРНЫЙ
              </span>
            )}
            <p className="font-display text-sm tracking-widest text-white/50 uppercase">{t.name}</p>
            <p className="mt-5 flex items-baseline gap-2">
              <RobuxIcon className="size-8 translate-y-1" style={{ color: "var(--acc3)" }} />
              <span className="font-display text-4xl font-black">{t.robux}</span>
              <span className="text-sm text-white/45">/ месяц</span>
            </p>
            <p className="mt-2 text-sm text-white/45">{t.hint}</p>
            <p className="font-display mt-6 text-2xl font-bold">
              {t.price}
              <span className="ml-1 text-sm font-medium text-white/40">USD</span>
            </p>
            <a
              href="https://www.roblox.com/premium/membership"
              target="_blank"
              rel="noreferrer"
              className={cx(
                "mt-6 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold",
                t.popular ? "btn-acc shine" : "btn-ghost"
              )}
            >
              Выбрать план
            </a>
          </motion.div>
        ))}
      </section>

      <section className="glass rounded-[26px] p-7 md:p-9">
        <h2 className="font-display text-xl font-bold">Что входит в подписку</h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-2">
          {PERKS.map((p) => {
            const Icon = p.icon;
            return (
              <li key={p.text} className="flex items-start gap-3.5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: "var(--acc-soft)" }}>
                  <Icon className="size-5" />
                </span>
                <p className="pt-1.5 text-sm text-white/65">{p.text}</p>
              </li>
            );
          })}
        </ul>
        <div className="mt-7 flex items-start gap-2.5 rounded-2xl bg-white/4 p-4 text-xs text-white/45">
          <Check className="mt-0.5 size-4 shrink-0 text-emerald-400" />
          Оплата и активация проходят только на официальном домене roblox.com. RoLaunch не обрабатывает платежи и
          не запрашивает пароль.
        </div>
      </section>
    </Page>
  );
}
