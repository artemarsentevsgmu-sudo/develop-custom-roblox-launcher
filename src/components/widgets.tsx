"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CloudSun, Music2, Pause, Play, Volume2, Activity, MapPin, Loader2 } from "lucide-react";
import { useFetch } from "@/lib/client";
import { fmtCompact } from "@/lib/shared";
import { useFx } from "@/components/fx";
import { CountUp } from "@/components/ui";

/* ---------------- clock ---------------- */

export function ClockWidget() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!now) return <div className="skeleton h-full min-h-32 rounded-[22px]" />;

  const time = now.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  const sec = now.getSeconds();
  const date = now.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="glass card-hover relative overflow-hidden rounded-[22px] p-5">
      <div
        className="pointer-events-none absolute -top-10 -right-8 size-32 rounded-full opacity-20 blur-2xl"
        style={{ background: "var(--acc1)" }}
      />
      <p className="text-[11px] tracking-[0.2em] text-white/40 uppercase">Время</p>
      <p className="font-display mt-2 text-4xl font-black tabular-nums">
        {time}
        <span className="ml-1 align-super text-base font-bold text-white/35">
          {String(sec).padStart(2, "0")}
        </span>
      </p>
      <p className="mt-1 text-sm text-white/50 first-letter:uppercase">{date}</p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${(sec / 59) * 100}%`, background: "linear-gradient(90deg,var(--acc1),var(--acc2))" }}
        />
      </div>
    </div>
  );
}

/* ---------------- weather ---------------- */

interface WeatherData {
  place: string;
  temp: number;
  feels: number;
  humidity: number;
  wind: number;
  text: string;
  icon: string;
  forecast: { date: string; max: number; min: number }[];
}

export function WeatherWidget({ city }: { city: string }) {
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  useEffect(() => {
    if (!navigator.geolocation || city) return;
    navigator.geolocation.getCurrentPosition(
      (p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => setCoords(null),
      { timeout: 4000 }
    );
  }, [city]);

  const url = coords
    ? `/api/weather?lat=${coords.lat}&lon=${coords.lon}`
    : `/api/weather?city=${encodeURIComponent(city || "Москва")}`;
  const { data, loading } = useFetch<WeatherData>(url, [url]);

  if (loading && !data) return <div className="skeleton h-full min-h-32 rounded-[22px]" />;
  if (!data) {
    return (
      <div className="glass flex min-h-32 items-center gap-3 rounded-[22px] p-5 text-sm text-white/45">
        <CloudSun className="size-5" /> Погода недоступна
      </div>
    );
  }

  return (
    <div className="glass card-hover relative overflow-hidden rounded-[22px] p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-white/40 uppercase">
            <MapPin className="size-3" /> {data.place}
          </p>
          <p className="font-display mt-2 text-4xl font-black">
            {data.temp}°
            <span className="ml-1.5 text-base font-medium text-white/40">ощущ. {data.feels}°</span>
          </p>
          <p className="mt-1 text-sm text-white/55">{data.text}</p>
        </div>
        <span className="text-5xl">{data.icon}</span>
      </div>
      <div className="mt-3 flex gap-3 text-xs text-white/45">
        <span>💧 {data.humidity}%</span>
        <span>💨 {data.wind} км/ч</span>
      </div>
      <div className="mt-3 flex gap-2">
        {data.forecast.map((f) => (
          <span key={f.date} className="chip flex-1 rounded-lg px-2 py-1 text-center text-[11px]">
            <span className="block text-white/40">
              {new Date(f.date).toLocaleDateString("ru-RU", { weekday: "short" })}
            </span>
            <strong>{f.max}°</strong>
            <span className="text-white/35">/{f.min}°</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------- ambient music (WebAudio, original generative pad) ---------------- */

const SCALE = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];

export function MusicWidget() {
  const [playing, setPlaying] = useState(false);
  const [vol, setVol] = useState(0.25);
  const ac = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const timer = useRef<number | null>(null);

  const stop = () => {
    if (timer.current) window.clearInterval(timer.current);
    timer.current = null;
    master.current?.gain.setTargetAtTime(0, ac.current?.currentTime ?? 0, 0.2);
    setPlaying(false);
  };

  const start = () => {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!ac.current) {
        ac.current = new AC();
        master.current = ac.current.createGain();
        const rev = ac.current.createBiquadFilter();
        rev.type = "lowpass";
        rev.frequency.value = 1600;
        master.current.connect(rev).connect(ac.current.destination);
      }
      void ac.current.resume();
      master.current!.gain.setTargetAtTime(vol, ac.current.currentTime, 0.4);

      const note = () => {
        const a = ac.current!;
        const freq = SCALE[Math.floor(Math.random() * SCALE.length)] * (Math.random() > 0.7 ? 2 : 1);
        const osc = a.createOscillator();
        const g = a.createGain();
        osc.type = Math.random() > 0.5 ? "sine" : "triangle";
        osc.frequency.value = freq;
        const t = a.currentTime;
        const dur = 2.6 + Math.random() * 2.4;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18, t + 0.8);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        osc.connect(g).connect(master.current!);
        osc.start(t);
        osc.stop(t + dur + 0.1);
      };
      note();
      timer.current = window.setInterval(note, 1400);
      setPlaying(true);
    } catch {
      /* no audio */
    }
  };

  useEffect(() => () => stop(), []);
  useEffect(() => {
    if (playing && master.current && ac.current) {
      master.current.gain.setTargetAtTime(vol, ac.current.currentTime, 0.2);
    }
  }, [vol, playing]);

  return (
    <div className="glass card-hover relative overflow-hidden rounded-[22px] p-5">
      <p className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-white/40 uppercase">
        <Music2 className="size-3" /> Эмбиент
      </p>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => (playing ? stop() : start())}
          className="btn-acc grid size-12 shrink-0 cursor-pointer place-items-center rounded-2xl"
          aria-label={playing ? "Пауза" : "Играть"}
        >
          {playing ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold">Cosmic Drift</p>
          <p className="truncate text-xs text-white/45">генеративный пад · RoLaunch</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Volume2 className="size-3.5 shrink-0 text-white/40" />
        <input
          type="range"
          min={0}
          max={100}
          value={vol * 100}
          onChange={(e) => setVol(Number(e.target.value) / 100)}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--acc2)]"
        />
      </div>
      {playing && (
        <div className="mt-3 flex h-6 items-end gap-0.5">
          {Array.from({ length: 28 }).map((_, i) => (
            <motion.span
              key={i}
              className="flex-1 rounded-sm"
              style={{ background: "linear-gradient(180deg,var(--acc2),var(--acc1))" }}
              animate={{ height: [`${10 + Math.random() * 40}%`, `${30 + Math.random() * 70}%`, `${10 + Math.random() * 40}%`] }}
              transition={{ duration: 1.2 + Math.random(), repeat: Infinity, delay: i * 0.03 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- workspace mini stats ---------------- */

export function StatsWidget() {
  const { data, loading } = useFetch<{
    totals: { net: number; units: number };
    deltas: { net: number };
  }>("/api/workspace/analytics?range=7&bucket=day");

  if (loading && !data) return <div className="skeleton h-full min-h-32 rounded-[22px]" />;
  if (!data) return null;
  const up = data.deltas.net >= 0;

  // Nothing imported into the local ledger yet — don't show a hollow zero card
  if (!data.totals.net && !data.totals.units) {
    return (
      <div className="glass card-hover relative overflow-hidden rounded-[22px] p-5">
        <p className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-white/40 uppercase">
          <Activity className="size-3" /> Мастерская
        </p>
        <p className="mt-3 text-sm text-white/55">Данных о продажах пока нет</p>
        <Link
          href="/studio/analytics"
          className="chip mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition hover:border-white/25"
        >
          Открыть статистику группы →
        </Link>
      </div>
    );
  }

  return (
    <div className="glass card-hover relative overflow-hidden rounded-[22px] p-5">
      <div
        className="pointer-events-none absolute -bottom-10 -left-6 size-32 rounded-full opacity-20 blur-2xl"
        style={{ background: "var(--acc2)" }}
      />
      <p className="flex items-center gap-1.5 text-[11px] tracking-[0.2em] text-white/40 uppercase">
        <Activity className="size-3" /> Мастерская · 7 дней
      </p>
      <p className="font-display mt-2 text-3xl font-black">
        <CountUp value={data.totals.net} /> <span className="text-lg text-white/40">R$</span>
      </p>
      <p className="mt-1 text-sm text-white/50">{fmtCompact(data.totals.units)} продаж</p>
      <span
        className="chip mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold"
        style={{ color: up ? "#34d399" : "#fb7185" }}
      >
        {up ? "▲" : "▼"} {Math.abs(data.deltas.net).toFixed(1)}%
      </span>
    </div>
  );
}

/* ---------------- board ---------------- */

export function WidgetBoard() {
  const { fx, ready } = useFx();
  if (!ready) return null;
  const items = [
    fx.widgets.clock && <ClockWidget key="clock" />,
    fx.widgets.weather && <WeatherWidget key="weather" city={fx.weatherCity} />,
    fx.widgets.music && <MusicWidget key="music" />,
    fx.widgets.stats && <StatsWidget key="stats" />,
  ].filter(Boolean);
  if (!items.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4"
    >
      {items}
    </motion.section>
  );
}

export const _spinner = Loader2;
