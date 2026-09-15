"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useLocal } from "@/lib/client";

export type ThemeMode = "dark" | "light" | "auto";
export type SoundPack = "off" | "soft" | "arcade" | "cosmic";

export interface FxSettings {
  theme: ThemeMode;
  soundPack: SoundPack;
  volume: number; // 0..1
  bgUrl: string;
  bgType: "none" | "image" | "video";
  bgBlur: number;
  bgDim: number;
  widgets: { clock: boolean; weather: boolean; music: boolean; stats: boolean };
  weatherCity: string;
}

const DEFAULTS: FxSettings = {
  theme: "dark",
  soundPack: "soft",
  volume: 0.35,
  bgUrl: "",
  bgType: "none",
  bgBlur: 0,
  bgDim: 72,
  widgets: { clock: true, weather: true, music: false, stats: true },
  weatherCity: "Москва",
};

export type SfxName = "hover" | "click" | "success" | "error" | "launch" | "coin";

interface FxShape {
  fx: FxSettings;
  setFx: (v: FxSettings | ((p: FxSettings) => FxSettings)) => void;
  play: (name: SfxName) => void;
  ready: boolean;
}

const Ctx = createContext<FxShape>({
  fx: DEFAULTS,
  setFx: () => {},
  play: () => {},
  ready: false,
});

export const useFx = () => useContext(Ctx);

/* Synthesised via WebAudio — no external audio files, fully original tones. */
const PACKS: Record<Exclude<SoundPack, "off">, Record<SfxName, { f: number[]; d: number; type: OscillatorType }>> = {
  soft: {
    hover: { f: [880], d: 0.05, type: "sine" },
    click: { f: [520, 780], d: 0.09, type: "sine" },
    success: { f: [660, 880, 1320], d: 0.22, type: "sine" },
    error: { f: [300, 200], d: 0.22, type: "sine" },
    launch: { f: [440, 660, 990], d: 0.3, type: "sine" },
    coin: { f: [1046, 1568], d: 0.14, type: "triangle" },
  },
  arcade: {
    hover: { f: [1200], d: 0.04, type: "square" },
    click: { f: [700, 1100], d: 0.08, type: "square" },
    success: { f: [523, 659, 784, 1046], d: 0.26, type: "square" },
    error: { f: [220, 160], d: 0.26, type: "sawtooth" },
    launch: { f: [330, 494, 659, 988], d: 0.34, type: "square" },
    coin: { f: [988, 1319], d: 0.12, type: "square" },
  },
  cosmic: {
    hover: { f: [1480], d: 0.07, type: "triangle" },
    click: { f: [420, 620], d: 0.12, type: "triangle" },
    success: { f: [523, 784, 1174], d: 0.4, type: "triangle" },
    error: { f: [180, 120], d: 0.35, type: "sine" },
    launch: { f: [220, 440, 880, 1760], d: 0.5, type: "triangle" },
    coin: { f: [1318, 1760], d: 0.2, type: "sine" },
  },
};

export function FxProvider({ children }: { children: ReactNode }) {
  const [fx, setFx, ready] = useLocal<FxSettings>("rolaunch.fx", DEFAULTS);
  const acRef = useRef<AudioContext | null>(null);

  /* apply theme + background to <html> */
  useEffect(() => {
    if (!ready) return;
    const el = document.documentElement;
    const resolve = (): "dark" | "light" => {
      if (fx.theme === "auto") {
        return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
      }
      return fx.theme;
    };
    el.dataset.theme = resolve();
    if (fx.theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: light)");
      const handler = () => (el.dataset.theme = resolve());
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [fx.theme, ready]);

  const play = useCallback(
    (name: SfxName) => {
      if (!ready || fx.soundPack === "off" || fx.volume <= 0) return;
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!acRef.current) acRef.current = new AC();
        const ac = acRef.current;
        if (ac.state === "suspended") void ac.resume();
        const spec = PACKS[fx.soundPack][name];
        const now = ac.currentTime;
        spec.f.forEach((freq, i) => {
          const osc = ac.createOscillator();
          const gain = ac.createGain();
          osc.type = spec.type;
          osc.frequency.setValueAtTime(freq, now + i * (spec.d / spec.f.length));
          const start = now + i * (spec.d / spec.f.length);
          const dur = spec.d / spec.f.length;
          gain.gain.setValueAtTime(0, start);
          gain.gain.linearRampToValueAtTime(fx.volume * 0.5, start + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
          osc.connect(gain).connect(ac.destination);
          osc.start(start);
          osc.stop(start + dur + 0.02);
        });
      } catch {
        /* audio unavailable */
      }
    },
    [fx.soundPack, fx.volume, ready]
  );

  /* global click/hover sfx on interactive elements */
  useEffect(() => {
    if (!ready || fx.soundPack === "off") return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("button, a, [role='button']")) play("click");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [fx.soundPack, play, ready]);

  const value = useMemo(() => ({ fx, setFx, play, ready }), [fx, setFx, play, ready]);

  return (
    <Ctx.Provider value={value}>
      {ready && fx.bgType !== "none" && fx.bgUrl ? (
        <>
          {fx.bgType === "video" ? (
            <video
              className="user-bg"
              src={fx.bgUrl}
              autoPlay
              loop
              muted
              playsInline
              style={{ filter: fx.bgBlur ? `blur(${fx.bgBlur}px)` : undefined }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="user-bg"
              src={fx.bgUrl}
              alt=""
              style={{ filter: fx.bgBlur ? `blur(${fx.bgBlur}px)` : undefined }}
            />
          )}
          <div
            className="user-bg-veil"
            style={{ background: `color-mix(in srgb, var(--bg) ${fx.bgDim}%, transparent)` }}
          />
        </>
      ) : null}
      {children}
    </Ctx.Provider>
  );
}

/** Small helper so any element can emit a sound on hover. */
export function useHoverSound() {
  const { play } = useFx();
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 1500);
    return () => clearTimeout(t);
  }, []);
  return useCallback(() => {
    if (armed) play("hover");
  }, [armed, play]);
}
