"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BookOpenText,
  Boxes,
  CircleDollarSign,
  CloudUpload,
  Download,
  Hammer,
  UsersRound,
} from "lucide-react";
import { Page, SmartImage } from "@/components/ui";
import { usePageTitle } from "@/components/shell";

const FEATURES = [
  {
    icon: Boxes,
    title: "Мощный 3D-редактор",
    text: "Собирайте миры из деталей, терраина и освещения — как конструктор, только безграничный.",
  },
  {
    icon: Hammer,
    title: "Язык Luau",
    text: "Быстрый наследник Lua с типами. Первый скрипт пишется за вечер, документация — на русском.",
  },
  {
    icon: CloudUpload,
    title: "Публикация в один клик",
    text: "Хостинг, сервера и матчмейкинг уже включены. Ваш мир доступен на всех платформах сразу.",
  },
  {
    icon: CircleDollarSign,
    title: "Монетизация",
    text: "Пропуски, девпродукты и Premium Payouts конвертируются в реальные деньги через DevEx.",
  },
];

export default function CreatePage() {
  usePageTitle("Студия");
  return (
    <Page className="space-y-10">
      <section className="relative overflow-hidden rounded-[32px] border border-white/10">
        <SmartImage src="/media/studio.jpg" alt="" className="absolute inset-0 size-full object-cover" eager />
        <div className="absolute inset-0 bg-gradient-to-r from-[#07070d] via-[#07070d]/66 to-transparent" />
        <div className="relative max-w-2xl p-8 md:p-14">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display flex items-center gap-2 text-[11px] tracking-[0.3em] text-white/50 uppercase"
          >
            <Hammer className="size-4" style={{ color: "var(--acc2)" }} /> Roblox Studio
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="font-display mt-4 text-4xl leading-[1.05] font-bold tracking-tight md:text-5xl"
          >
            Создайте мир, в который зайдут <span className="text-gradient">миллионы</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-4 max-w-lg text-white/60"
          >
            Бесплатная студия Roblox — полный цикл разработки: от первой детали до глобального релиза и
            аналитики.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <a
              href="https://www.roblox.com/create"
              target="_blank"
              rel="noreferrer"
              className="btn-acc shine inline-flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold"
            >
              <Download className="size-5" /> Скачать Studio
            </a>
            <a
              href="https://create.roblox.com/docs"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost inline-flex items-center gap-2 rounded-2xl px-6 py-4 text-base font-semibold"
            >
              <BookOpenText className="size-5" /> Документация
            </a>
          </motion.div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="glass card-hover rounded-[24px] p-6"
            >
              <span className="grid size-12 place-items-center rounded-2xl" style={{ background: "var(--acc-soft)" }}>
                <Icon className="size-6" />
              </span>
              <h3 className="font-display mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{f.text}</p>
            </motion.div>
          );
        })}
      </section>

      <section className="glass flex flex-col gap-4 rounded-[26px] p-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--acc-soft)" }}>
            <UsersRound className="size-6" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold">Сообщество разработчиков</h3>
            <p className="mt-1 text-sm text-white/55">
              DevForum, Creator Hub и программы акселерации — задавайте вопросы и находите команду
            </p>
          </div>
        </div>
        <a
          href="https://devforum.roblox.com"
          target="_blank"
          rel="noreferrer"
          className="btn-acc shine inline-flex shrink-0 items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold"
        >
          Открыть DevForum <ArrowUpRight className="size-4" />
        </a>
      </section>
    </Page>
  );
}
