"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, MonitorPlay, Globe, DownloadCloud, CheckCircle2, Loader2 } from "lucide-react";
import type { LaunchTarget } from "@/lib/shared";
import { buildLaunchLinks, fireProtocol } from "@/lib/client";
import { useStore } from "@/components/store";
import { HexSpinner } from "@/components/icons";

interface LauncherShape {
  play: (target: LaunchTarget) => void;
}

const Ctx = createContext<LauncherShape>({ play: () => {} });
export const useLauncher = () => useContext(Ctx);

type Stage = "preparing" | "fallback";

export function LauncherProvider({ children }: { children: ReactNode }) {
  const { addRecent, settings } = useStore();
  const [target, setTarget] = useState<LaunchTarget | null>(null);
  const [stage, setStage] = useState<Stage>("preparing");
  const timer = useRef<number | null>(null);

  const play = useCallback(
    (t: LaunchTarget) => {
      setTarget(t);
      setStage("preparing");
      addRecent({
        universeId: t.universeId ?? 0,
        placeId: t.placeId,
        name: t.name,
        iconUrl: t.iconUrl ?? null,
      });
      const links = buildLaunchLinks(t);
      if (settings.launchMode === "web") {
        window.open(links.web, "_blank", "noopener");
        return;
      }
      // try native protocol first
      fireProtocol(links.scheme);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => {
        if (settings.launchMode === "deeplink") fireProtocol(links.ux);
        setStage("fallback");
      }, 2400);
    },
    [addRecent, settings.launchMode]
  );

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const close = useCallback(() => {
    setTarget(null);
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const value = useMemo(() => ({ play }), [play]);
  const links = target ? buildLaunchLinks(target) : null;

  return (
    <Ctx.Provider value={value}>
      {children}
      <AnimatePresence>
        {target && links && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="glass-strong relative w-full max-w-md overflow-hidden rounded-[28px] p-7"
            >
              <div
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[130%] -translate-x-1/2 opacity-40 blur-3xl"
                style={{ background: "linear-gradient(120deg, var(--acc1), var(--acc2), var(--acc3))" }}
              />
              <button
                onClick={close}
                className="btn-ghost absolute top-4 right-4 grid size-9 cursor-pointer place-items-center rounded-full"
                aria-label="Закрыть"
              >
                <X className="size-4" />
              </button>

              <div className="relative flex items-center gap-4">
                <div className="relative">
                  {target.iconUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={target.iconUrl}
                      alt=""
                      className="size-16 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="grid size-16 place-items-center rounded-2xl bg-white/10">
                      <MonitorPlay className="size-7" />
                    </div>
                  )}
                  <span className="anim-pulse-ring absolute -inset-1 rounded-[20px]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs tracking-[0.22em] text-white/50 uppercase">Запуск</p>
                  <h3 className="truncate text-lg font-bold">{target.name}</h3>
                  {target.jobId && (
                    <p className="truncate text-xs text-white/50">сервер {target.jobId.slice(0, 8)}…</p>
                  )}
                </div>
              </div>

              <div className="relative mt-6">
                {stage === "preparing" ? (
                  <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                    <Loader2 className="size-5 animate-spin" style={{ color: "var(--acc2)" }} />
                    <div>
                      <p className="font-semibold">Передаём команду клиенту Roblox…</p>
                      <p className="text-sm text-white/55">Обычно это занимает пару секунд</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4">
                      <CheckCircle2 className="size-5 text-emerald-400" />
                      <p className="text-sm text-white/70">
                        Если игра не открылась — выберите другой способ ниже
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        onClick={() => fireProtocol(links.ux)}
                        className="btn-acc shine flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                      >
                        <MonitorPlay className="size-4" /> Повторить
                      </button>
                      <button
                        onClick={() => window.open(links.web, "_blank", "noopener")}
                        className="btn-ghost flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
                      >
                        <Globe className="size-4" /> В браузере
                      </button>
                    </div>
                    <a
                      href="https://www.roblox.com/download"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-xs text-white/45 transition hover:text-white/80"
                    >
                      <DownloadCloud className="size-3.5" />
                      Roblox не установлен? Скачать с официального сайта
                    </a>
                  </div>
                )}
              </div>

              {stage === "preparing" && (
                <div className="absolute right-6 bottom-5 opacity-50">
                  <HexSpinner className="size-8" />
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
