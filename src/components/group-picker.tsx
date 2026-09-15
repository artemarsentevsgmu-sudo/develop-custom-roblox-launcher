"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Loader2, ShieldCheck, ShieldAlert, Users, Crown, Check } from "lucide-react";
import { api, useLocal } from "@/lib/client";
import { cx, fmtCompact } from "@/lib/shared";
import { SmartImage } from "@/components/ui";

export const MANAGE_RANK = 254;

export interface UserGroupRow {
  id: number;
  name: string;
  memberCount: number;
  verified: boolean;
  icon: string | null;
  role: { id: number; name: string; rank: number };
  canManage: boolean;
}

export interface SelectedGroup {
  id: number;
  name: string;
  icon: string | null;
  roleName: string;
  rank: number;
  username: string;
}

/** Shared picker: resolves a player's groups and only unlocks those with rank >= 254. */
export function GroupPicker({
  value,
  onChange,
}: {
  value: SelectedGroup | null;
  onChange: (g: SelectedGroup | null) => void;
}) {
  const [savedUser, setSavedUser] = useLocal<string>("rolaunch.groupUser", "");
  const [input, setInput] = useState("");
  const [groups, setGroups] = useState<UserGroupRow[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (savedUser && !input) setInput(savedUser);
  }, [savedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(
    async (who: string) => {
      const name = who.trim();
      if (!name) return;
      setBusy(true);
      setErr(null);
      try {
        const r = await api<{ groups: UserGroupRow[] }>(
          `/api/roblox/user-groups?user=${encodeURIComponent(name)}`
        );
        setGroups(r.groups);
        setSavedUser(name);
        if (!r.groups.some((g) => g.canManage)) {
          setErr(
            `У @${name} нет групп с рангом ${MANAGE_RANK}+. Статистика доступна только администраторам и владельцам.`
          );
        }
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Не удалось получить группы");
        setGroups(null);
      }
      setBusy(false);
    },
    [setSavedUser]
  );

  useEffect(() => {
    if (savedUser && groups === null && !busy) void load(savedUser);
  }, [savedUser]); // eslint-disable-line react-hooks/exhaustive-deps

  if (value) {
    return (
      <div
        className="flex flex-wrap items-center gap-4 rounded-[22px] p-4"
        style={{
          background: "var(--acc-soft)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--acc1) 30%, transparent)",
        }}
      >
        <SmartImage src={value.icon} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold">{value.name}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-white/50">
            <span className="chip flex items-center gap-1 rounded-full px-2 py-0.5 text-emerald-300">
              <ShieldCheck className="size-3" /> {value.roleName} · ранг {value.rank}
            </span>
            <span>доступ подтверждён для @{value.username}</span>
          </p>
        </div>
        <button
          onClick={() => onChange(null)}
          className="btn-ghost cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold"
        >
          Сменить группу
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-[26px] p-5 md:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl" style={{ background: "var(--acc-soft)" }}>
          <ShieldCheck className="size-5" style={{ color: "var(--acc2)" }} />
        </span>
        <div>
          <p className="font-display font-bold">Выберите группу</p>
          <p className="text-sm text-white/45">
            Статистика открывается только для ролей с рангом <strong className="text-white/70">{MANAGE_RANK}+</strong>{" "}
            (админ / владелец)
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="chip flex flex-1 items-center gap-2.5 rounded-2xl px-4">
          <Search className="size-4 shrink-0 text-white/40" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load(input)}
            placeholder="Ваш ник в Roblox"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
        </div>
        <button
          onClick={() => load(input)}
          disabled={busy || !input.trim()}
          className="btn-acc shine flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
          Мои группы
        </button>
      </div>

      {err && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-400/25 bg-amber-400/8 p-3 text-xs text-amber-200">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" /> {err}
        </p>
      )}

      {groups && groups.length > 0 && (
        <div className="no-scrollbar mt-4 max-h-80 space-y-1.5 overflow-y-auto pr-1">
          {groups.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i, 10) * 0.03 }}
              disabled={!g.canManage}
              onClick={() =>
                onChange({
                  id: g.id,
                  name: g.name,
                  icon: g.icon,
                  roleName: g.role.name,
                  rank: g.role.rank,
                  username: input.trim() || savedUser,
                })
              }
              className={cx(
                "flex w-full items-center gap-3 rounded-2xl p-3 text-left transition",
                g.canManage ? "cursor-pointer bg-white/4 hover:bg-white/8" : "bg-white/2 opacity-45"
              )}
            >
              <SmartImage src={g.icon} alt="" className="size-11 shrink-0 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{g.name}</span>
                <span className="flex items-center gap-2 text-xs text-white/45">
                  <Users className="size-3" /> {fmtCompact(g.memberCount)}
                  <span className="chip rounded px-1.5 py-0.5">{g.role.name}</span>
                </span>
              </span>
              <span
                className={cx(
                  "flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  g.canManage ? "chip text-emerald-300" : "chip text-white/35"
                )}
              >
                {g.canManage ? <Crown className="size-3" /> : null}
                ранг {g.role.rank}
              </span>
              {g.canManage && <Check className="size-4 shrink-0" style={{ color: "var(--acc2)" }} />}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
