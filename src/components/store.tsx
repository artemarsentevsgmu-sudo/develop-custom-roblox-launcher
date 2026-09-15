"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import { useLocal } from "@/lib/client";
import type { FavEntry } from "@/lib/shared";

export type Accent = "violet" | "cyan" | "rose" | "lime";
export type MotionMode = "full" | "calm";
export type LaunchMode = "auto" | "deeplink" | "web";

export interface Settings {
  accent: Accent;
  motion: MotionMode;
  launchMode: LaunchMode;
  channel: string;
  username: string;
  fastFlags: string;
  /** .ROBLOSECURITY cookie value — lives only in this browser's localStorage */
  cookie: string;
}

const DEFAULTS: Settings = {
  accent: "violet",
  motion: "full",
  launchMode: "auto",
  channel: "LIVE",
  username: "",
  fastFlags: "{\n  \"DFIntTaskSchedulerTargetFps\": 240,\n  \"FFlagDisablePostFx\": true\n}",
  cookie: "",
};

interface StoreShape {
  settings: Settings;
  setSettings: (v: Settings | ((p: Settings) => Settings)) => void;
  favorites: FavEntry[];
  toggleFavorite: (g: Omit<FavEntry, "at">) => void;
  isFavorite: (universeId: number) => boolean;
  recents: FavEntry[];
  addRecent: (g: Omit<FavEntry, "at">) => void;
  clearRecents: () => void;
  clearFavorites: () => void;
}

const StoreCtx = createContext<StoreShape | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useLocal<Settings>("rolaunch.settings", DEFAULTS);
  const [favorites, setFavorites] = useLocal<FavEntry[]>("rolaunch.favorites", []);
  const [recents, setRecents] = useLocal<FavEntry[]>("rolaunch.recents", []);

  const value = useMemo<StoreShape>(
    () => ({
      settings,
      setSettings: (v) => setSettings(v),
      favorites,
      toggleFavorite: (g) =>
        setFavorites((prev) => {
          const exists = prev.some((f) => f.universeId === g.universeId);
          if (exists) return prev.filter((f) => f.universeId !== g.universeId);
          return [{ ...g, at: Date.now() }, ...prev].slice(0, 200);
        }),
      isFavorite: (universeId) => favorites.some((f) => f.universeId === universeId),
      recents,
      addRecent: (g) =>
        setRecents((prev) => {
          const rest = prev.filter((r) => r.universeId !== g.universeId);
          return [{ ...g, at: Date.now() }, ...rest].slice(0, 48);
        }),
      clearRecents: () => setRecents([]),
      clearFavorites: () => setFavorites([]),
    }),
    [settings, setSettings, favorites, setFavorites, recents, setRecents]
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreShape {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
