"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Users, BadgeCheck, DoorOpen, Loader2, UsersRound } from "lucide-react";
import { api } from "@/lib/client";
import { fmtCompact } from "@/lib/shared";
import { EmptyState, Page, SmartImage } from "@/components/ui";
import { usePageTitle } from "@/components/shell";

interface GroupHit {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  verified: boolean;
  publicEntry: boolean;
  icon: string | null;
}

const SUGGESTED = [
  { id: 7, name: "Roblox Fan Club" },
  { id: 1200769, name: "Roblox Developer" },
  { id: 4199740, name: "Creators" },
];

export default function GroupsPage() {
  usePageTitle("Группы");
  const [q, setQ] = useState("");
  const [groups, setGroups] = useState<GroupHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const search = async (term?: string) => {
    const key = (term ?? q).trim();
    if (!key) return;
    setLoading(true);
    setErr(null);
    try {
      const r = await api<{ groups: GroupHit[] }>(`/api/roblox/group-search?q=${encodeURIComponent(key)}`);
      setGroups(r.groups);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Ошибка поиска");
    }
    setLoading(false);
  };

  return (
    <Page className="space-y-7">
      <header>
        <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Communities</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Статистика <span className="text-gradient">групп</span>
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Состав, роли, онлайн в мирах группы и соцсети — живые данные Roblox
        </p>
      </header>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="chip flex flex-1 items-center gap-2.5 rounded-2xl px-4">
          <Search className="size-4 shrink-0 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Название группы или её ID"
            className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
        </div>
        <button
          onClick={() => (/^\d+$/.test(q.trim()) ? (window.location.href = `/group/${q.trim()}`) : search())}
          disabled={loading || !q.trim()}
          className="btn-acc shine flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 py-3 text-sm font-bold disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Найти
        </button>
      </div>

      {!groups && (
        <section>
          <p className="mb-3 text-xs tracking-[0.2em] text-white/40 uppercase">Популярные</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <Link
                key={s.id}
                href={`/group/${s.id}`}
                className="chip cursor-pointer rounded-full px-4 py-2 text-sm transition hover:border-white/25"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {err && <p className="text-sm text-rose-300">{err}</p>}

      {groups && !groups.length && (
        <EmptyState icon={UsersRound} title="Группы не найдены" hint="Попробуйте другое название или введите ID" />
      )}

      {groups && groups.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 9) * 0.05, duration: 0.4 }}
            >
              <Link
                href={`/group/${g.id}`}
                className="glass card-hover shine flex h-full items-start gap-3.5 rounded-[22px] p-4"
              >
                <SmartImage src={g.icon} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-bold">
                    <span className="truncate">{g.name}</span>
                    {g.verified && <BadgeCheck className="size-4 shrink-0 text-sky-400" />}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-xs text-white/45">{g.description || "Без описания"}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                    <span className="chip flex items-center gap-1 rounded-full px-2 py-0.5">
                      <Users className="size-3" /> {fmtCompact(g.memberCount)}
                    </span>
                    {g.publicEntry && (
                      <span className="chip flex items-center gap-1 rounded-full px-2 py-0.5 text-emerald-300">
                        <DoorOpen className="size-3" /> открытая
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </Page>
  );
}
