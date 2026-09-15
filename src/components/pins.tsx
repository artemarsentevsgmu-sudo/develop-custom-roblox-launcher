"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Pin, PinOff, Play, Users } from "lucide-react";
import { api } from "@/lib/client";
import { cx, fmtCompact, type GameSummary } from "@/lib/shared";
import { SectionHeader, SmartImage, Rail } from "@/components/ui";
import { useLauncher } from "@/components/launcher";

interface PinRow {
  id: number;
  universeId: number;
  placeId: number;
  name: string;
  iconUrl: string | null;
}

/* tiny global event so the pin button anywhere refreshes the rail */
const EVT = "rolaunch:pins";
export const notifyPins = () => window.dispatchEvent(new CustomEvent(EVT));

export function usePins() {
  const [pins, setPins] = useState<PinRow[]>([]);
  const load = useCallback(async () => {
    try {
      const r = await api<{ pins: PinRow[] }>("/api/personal?what=pins");
      setPins(r.pins ?? []);
    } catch {
      /* offline is fine */
    }
  }, []);

  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener(EVT, h);
    return () => window.removeEventListener(EVT, h);
  }, [load]);

  const toggle = useCallback(
    async (game: Pick<GameSummary, "universeId" | "placeId" | "name" | "iconUrl">) => {
      await api("/api/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pin", game }),
      }).catch(() => null);
      await load();
      notifyPins();
    },
    [load]
  );

  return { pins, toggle, reload: load };
}

export function PinButton({
  game,
  className,
}: {
  game: Pick<GameSummary, "universeId" | "placeId" | "name" | "iconUrl">;
  className?: string;
}) {
  const { pins, toggle } = usePins();
  const pinned = pins.some((p) => p.universeId === game.universeId);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(game);
      }}
      title={pinned ? "Открепить" : "Закрепить на главной"}
      className={cx(
        "flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        pinned ? "chip-acc" : "btn-ghost",
        className
      )}
    >
      {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
      {pinned ? "Откреплено" : "Закрепить"}
    </button>
  );
}

export function PinnedRail() {
  const { pins, toggle } = usePins();
  const { play } = useLauncher();
  if (!pins.length) return null;

  return (
    <section>
      <SectionHeader title="Закреплённые" hint="Ваши избранные миры всегда под рукой" />
      <Rail>
        {pins.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 8) * 0.05 }}
            className="card-hover shine group relative w-56 shrink-0 overflow-hidden rounded-[22px] border border-white/10 bg-white/4"
          >
            <Link href={`/game/${p.universeId}`} className="flex items-center gap-3 p-3">
              <SmartImage src={p.iconUrl} alt="" className="size-14 shrink-0 rounded-xl object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-bold">{p.name}</span>
                <span className="flex items-center gap-1 text-[11px] text-white/40">
                  <Users className="size-3" /> place {fmtCompact(p.placeId)}
                </span>
              </span>
            </Link>
            <div className="flex gap-1.5 px-3 pb-3">
              <button
                onClick={() =>
                  play({ placeId: p.placeId, universeId: p.universeId, name: p.name, iconUrl: p.iconUrl })
                }
                className="btn-acc shine flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold"
              >
                <Play className="size-3.5 fill-current" /> Играть
              </button>
              <button
                onClick={() => void toggle(p)}
                className="btn-ghost grid size-8 cursor-pointer place-items-center rounded-xl"
                aria-label="Открепить"
              >
                <PinOff className="size-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </Rail>
    </section>
  );
}
