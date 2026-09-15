"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Palette,
  UserRound,
  Rocket,
  Download,
  Info,
  RefreshCw,
  Check,
  Terminal,
  Trash2,
  ExternalLink,
  MonitorPlay,
  Globe,
  TestTube2,
  Sparkles,
  AlertTriangle,
  KeyRound,
  LogIn,
  LogOut,
  Eye,
  EyeOff,
  ShieldAlert,
  BadgeCheck,
  Gem,
  MessageSquare,
  Users,
  BellRing,
  Loader2,
  Sun,
  Moon,
  Monitor,
  Image as ImageIcon,
  Volume2,
  Clock,
  CloudSun,
  Music2,
  Activity,
  LayoutGrid,
  Bot,
  Webhook,
  Send,
  Gamepad2,
} from "lucide-react";
import { cx, fmtCompact, type VersionsPayload } from "@/lib/shared";
import { api, fireProtocol, copyText } from "@/lib/client";
import { useStore, type Accent, type LaunchMode, type MotionMode } from "@/components/store";
import { useFx, type ThemeMode, type SoundPack } from "@/components/fx";
import { useAuth } from "@/components/auth";
import { CountUp, Page, SmartImage } from "@/components/ui";
import { RobuxIcon } from "@/components/icons";
import { usePageTitle } from "@/components/shell";
import React from "react";

function Section({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="glass rounded-[26px] p-6 md:p-7">
      <div className="mb-5 flex items-start gap-3.5">
        <div className="grid size-11 shrink-0 place-items-center rounded-2xl" style={{ background: "var(--acc-soft)" }}>
          <Icon className="size-5.5" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          {hint && <p className="mt-0.5 text-sm text-white/45">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const ACCENTS: { key: Accent; label: string; from: string; to: string }[] = [
  { key: "violet", label: "Ультрафиолет", from: "#7c5cff", to: "#35e0ff" },
  { key: "cyan", label: "Лёд", from: "#22d3ee", to: "#818cf8" },
  { key: "rose", label: "Рассвет", from: "#ff5c8a", to: "#ffb35c" },
  { key: "lime", label: "Неон", from: "#a3e635", to: "#38bdf8" },
];

const LAUNCH_MODES: { key: LaunchMode; title: string; hint: string }[] = [
  { key: "auto", title: "Автоматически", hint: "Сначала протокол, потом веб-версия" },
  { key: "deeplink", title: "Только клиент", hint: "Открывать установленный Roblox" },
  { key: "web", title: "Браузер", hint: "Всегда открывать roblox.com" },
];

const PRESETS: { key: string; label: string; flags: Record<string, unknown> }[] = [
  { key: "fps240", label: "FPS 240", flags: { DFIntTaskSchedulerTargetFps: 240 } },
  { key: "fpsmax", label: "FPS без лимита", flags: { DFIntTaskSchedulerTargetFps: 9999 } },
  { key: "nopost", label: "Без пост-эффектов", flags: { FFlagDisablePostFx: true } },
  { key: "vulkan", label: "Рендер Vulkan", flags: { FFlagDebugGraphicsPreferVulkan: true } },
  { key: "dx11", label: "Рендер DirectX 11", flags: { FFlagDebugGraphicsPreferD3D11: true } },
];

export default function SettingsPage() {
  usePageTitle("Настройки");
  const { settings, setSettings, clearFavorites, clearRecents } = useStore();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const [flagsInput, setFlagsInput] = useState(settings.fastFlags);
  const [flagError, setFlagError] = useState<string | null>(null);
  const [flagsSaved, setFlagsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [versions, setVersions] = useState<VersionsPayload | null>(null);
  const [versionsLoading, setVersionsLoading] = useState(false);

  React.useEffect(() => setFlagsInput(settings.fastFlags), [settings.fastFlags]);

  const loadVersions = React.useCallback(async () => {
    setVersionsLoading(true);
    try {
      setVersions(await api<VersionsPayload>("/api/roblox/version"));
    } catch {
      /* silent */
    }
    setVersionsLoading(false);
  }, []);

  React.useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const applyFlags = (raw: string) => {
    try {
      JSON.parse(raw);
      setFlagError(null);
      setSettings((s) => ({ ...s, fastFlags: raw }));
      setFlagsSaved(true);
      setTimeout(() => setFlagsSaved(false), 1500);
      return true;
    } catch (e) {
      setFlagError(e instanceof Error ? e.message : "Ошибка JSON");
      return false;
    }
  };

  const mergePreset = (flags: Record<string, unknown>) => {
    try {
      const base = JSON.parse(flagsInput || "{}");
      const next = JSON.stringify({ ...base, ...flags }, null, 2);
      setFlagsInput(next);
      applyFlags(next);
    } catch {
      setFlagError("Сначала исправьте JSON");
    }
  };

  const downloadFlags = () => {
    if (!applyFlags(flagsInput)) return;
    const blob = new Blob([flagsInput], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "GlobalBasicSettings_13.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const set = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const accentHint = useMemo(
    () => ACCENTS.find((a) => a.key === settings.accent)?.label ?? "",
    [settings.accent]
  );

  if (!mounted) return <Page>{null}</Page>;

  return (
    <Page className="space-y-6">
      <header>
        <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">Launcher settings</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          <span className="text-gradient">Настройки</span>
        </h1>
      </header>

      <AccountSection />

      <AppearanceSection />

      <SoundSection />

      <WidgetSection />

      <DiscordSection />

      <Section icon={UserRound} title="Профиль" hint="Гостевой режим: просто ник, без входа в аккаунт">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            defaultValue={settings.username}
            onBlur={(e) => set("username", e.target.value.trim())}
            onKeyDown={(e) => {
              if (e.key === "Enter") set("username", (e.target as HTMLInputElement).value.trim());
            }}
            placeholder="Ваш ник в Roblox"
            className="chip h-12 flex-1 rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/35 focus:border-white/25"
          />
          {settings.username && (
            <Link
              href={`/profile/${encodeURIComponent(settings.username)}`}
              className="btn-acc shine flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold"
            >
              Мой профиль <ExternalLink className="size-4" />
            </Link>
          )}
        </div>
      </Section>

      <Section icon={Palette} title="Внешний вид" hint={`Сейчас: ${accentHint}`}>
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.key}
              onClick={() => set("accent", a.key)}
              className={cx(
                "flex cursor-pointer items-center gap-2.5 rounded-2xl border px-4 py-3 transition-all",
                settings.accent === a.key
                  ? "border-white/40 bg-white/10"
                  : "chip hover:border-white/25"
              )}
            >
              <span
                className="size-5 rounded-full shadow-lg"
                style={{ background: `linear-gradient(120deg, ${a.from}, ${a.to})` }}
              />
              <span className="text-sm font-medium">{a.label}</span>
              {settings.accent === a.key && <Check className="size-4 text-emerald-400" />}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          {(
            [
              { key: "full", label: "Все анимации" },
              { key: "calm", label: "Спокойный режим" },
            ] as { key: MotionMode; label: string }[]
          ).map((m) => (
            <button
              key={m.key}
              onClick={() => set("motion", m.key)}
              className={cx(
                "cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition",
                settings.motion === m.key ? "chip-acc" : "chip text-white/55 hover:text-white"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Rocket} title="Запуск игр" hint="Как RoLaunch передаёт команду клиенту Roblox">
        <div className="grid gap-2.5 md:grid-cols-3">
          {LAUNCH_MODES.map((m) => (
            <button
              key={m.key}
              onClick={() => set("launchMode", m.key)}
              className={cx(
                "cursor-pointer rounded-2xl border p-4 text-left transition-all",
                settings.launchMode === m.key ? "border-transparent chip-acc" : "chip hover:border-white/25"
              )}
            >
              <p className="flex items-center gap-2 font-bold">
                {m.key === "web" ? <Globe className="size-4" /> : <MonitorPlay className="size-4" />}
                {m.title}
              </p>
              <p className="mt-1 text-xs text-white/50">{m.hint}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => fireProtocol("roblox://")}
            className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            <TestTube2 className="size-4" /> Проверить протокол
          </button>
          <select
            value={settings.channel}
            onChange={(e) => set("channel", e.target.value)}
            className="chip h-11 cursor-pointer rounded-xl bg-transparent px-3 text-sm outline-none"
          >
            <option value="LIVE" className="bg-[#0d0d17]">Канал LIVE (стабильный)</option>
            <option value="zintegration" className="bg-[#0d0d17]">zintegration</option>
            <option value="zcanary" className="bg-[#0d0d17]">zcanary</option>
          </select>
          <p className="text-xs text-white/35">Канал используется при следующем обновлении клиента</p>
        </div>
      </Section>

      <Section icon={Info} title="Информация о клиенте" hint="Актуальные сборки прямо с CDN Roblox">
        <div className="flex flex-wrap gap-2.5">
          <div className="chip rounded-2xl px-4 py-3">
            <p className="text-[11px] tracking-wider text-white/40 uppercase">Windows Player</p>
            <p className="mt-1 font-mono text-sm font-bold">{versions?.player.version ?? "…"}</p>
            <p className="font-mono text-[10px] text-white/35">{versions?.player.guid}</p>
          </div>
          <div className="chip rounded-2xl px-4 py-3">
            <p className="text-[11px] tracking-wider text-white/40 uppercase">Roblox Studio</p>
            <p className="mt-1 font-mono text-sm font-bold">{versions?.studio.version ?? "…"}</p>
            <p className="font-mono text-[10px] text-white/35">{versions?.studio.guid}</p>
          </div>
          <button
            onClick={loadVersions}
            disabled={versionsLoading}
            className="btn-ghost flex cursor-pointer items-center gap-2 self-stretch rounded-2xl px-4 text-sm font-semibold disabled:opacity-50"
          >
            <RefreshCw className={cx("size-4", versionsLoading && "animate-spin")} /> Обновить
          </button>
        </div>
      </Section>

      <Section icon={Terminal} title="FastFlags" hint="Тонкая настройка клиента — как в Bloxstrap (экспериментально)">
        <div className="mb-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => mergePreset(p.flags)}
              className="chip flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:border-white/25"
            >
              <Sparkles className="size-3" style={{ color: "var(--acc2)" }} /> {p.label}
            </button>
          ))}
        </div>
        <textarea
          value={flagsInput}
          onChange={(e) => {
            setFlagsInput(e.target.value);
            setFlagError(null);
          }}
          spellCheck={false}
          rows={8}
          className={cx(
            "w-full rounded-2xl border bg-black/30 p-4 font-mono text-[13px] leading-relaxed outline-none transition",
            flagError ? "border-rose-500/60" : "border-white/10 focus:border-white/30"
          )}
        />
        {flagError && (
          <p className="mt-2 flex items-center gap-2 text-xs text-rose-300">
            <AlertTriangle className="size-3.5" /> {flagError}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            onClick={() => applyFlags(flagsInput)}
            className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold"
          >
            {flagsSaved ? <Check className="size-4 text-emerald-400" /> : <Check className="size-4" />}
            {flagsSaved ? "Сохранено" : "Применить"}
          </button>
          <button
            onClick={downloadFlags}
            className="btn-acc shine flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold"
          >
            <Download className="size-4" /> Скачать GlobalBasicSettings_13.json
          </button>
          <button
            onClick={async () => {
              await copyText("%localappdata%\\Roblox\\ClientSettings");
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="btn-ghost cursor-pointer rounded-xl px-4 py-2.5 font-mono text-xs"
          >
            {copied ? "Путь скопирован!" : "%localappdata%\\Roblox\\ClientSettings"}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-white/40">
          Положите скачанный файл в папку ClientSettings установки Roblox и перезапустите клиент. Флаги применяются
          клиентом при старте; используйте на свой страх и риск.
        </p>
      </Section>

      <Section icon={Trash2} title="Локальные данные" hint="Избранное и история запусков хранятся только на этом устройстве">
        <div className="flex flex-wrap gap-2.5">
          <button onClick={clearFavorites} className="btn-ghost cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-300">
            Очистить избранное
          </button>
          <button onClick={clearRecents} className="btn-ghost cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-300">
            Очистить историю запусков
          </button>
        </div>
      </Section>
    </Page>
  );
}

/* ---------------- appearance: themes & backgrounds ---------------- */

function AppearanceSection() {
  const { fx, setFx, ready } = useFx();
  if (!ready) return null;

  const THEMES: { key: ThemeMode; label: string; hint: string }[] = [
    { key: "dark", label: "Тёмная", hint: "космический контраст" },
    { key: "light", label: "Светлая", hint: "дневной режим" },
    { key: "auto", label: "Авто", hint: "по системе" },
  ];
  const PRESET_BG = [
    { url: "/media/premium.jpg", label: "Кристалл" },
    { url: "/media/robux.jpg", label: "Монеты" },
    { url: "/media/studio.jpg", label: "Студия" },
  ];

  return (
    <Section icon={Palette} title="Тема и фон" hint="Оформление лаунчера под себя">
      <p className="mb-2.5 text-xs tracking-[0.18em] text-white/40 uppercase">Режим</p>
      <div className="mb-5 flex flex-wrap gap-2.5">
        {THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => setFx((s) => ({ ...s, theme: t.key }))}
            className={cx(
              "flex cursor-pointer items-center gap-2.5 rounded-2xl border px-4 py-3 transition-all",
              fx.theme === t.key ? "border-white/40 bg-white/10" : "chip hover:border-white/25"
            )}
          >
            {t.key === "light" ? <Sun className="size-4" /> : t.key === "dark" ? <Moon className="size-4" /> : <Monitor className="size-4" />}
            <span className="text-left">
              <span className="block text-sm font-semibold">{t.label}</span>
              <span className="block text-[11px] text-white/45">{t.hint}</span>
            </span>
            {fx.theme === t.key && <Check className="size-4 text-emerald-400" />}
          </button>
        ))}
      </div>

      <p className="mb-2.5 text-xs tracking-[0.18em] text-white/40 uppercase">Фоновое изображение / видео</p>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          onClick={() => setFx((s) => ({ ...s, bgType: "none", bgUrl: "" }))}
          className={cx("cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition", fx.bgType === "none" ? "chip-acc" : "chip text-white/55")}
        >
          Без фона
        </button>
        {PRESET_BG.map((b) => (
          <button
            key={b.url}
            onClick={() => setFx((s) => ({ ...s, bgType: "image", bgUrl: b.url }))}
            className={cx(
              "cursor-pointer overflow-hidden rounded-xl border transition",
              fx.bgUrl === b.url ? "border-white/50" : "border-white/10 hover:border-white/30"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={b.url} alt={b.label} className="h-12 w-20 object-cover" />
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="chip flex flex-1 items-center gap-2.5 rounded-2xl px-4">
          <ImageIcon className="size-4 shrink-0 text-white/40" />
          <input
            value={fx.bgUrl}
            onChange={(e) => {
              const url = e.target.value;
              const isVideo = /\.(mp4|webm|ogv)(\?|$)/i.test(url);
              setFx((s) => ({ ...s, bgUrl: url, bgType: url ? (isVideo ? "video" : "image") : "none" }));
            }}
            placeholder="URL картинки или видео (mp4/webm)"
            className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
        </div>
      </div>
      {fx.bgType !== "none" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="chip flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
            <span className="w-20 shrink-0 text-white/55">Размытие</span>
            <input
              type="range"
              min={0}
              max={24}
              value={fx.bgBlur}
              onChange={(e) => setFx((s) => ({ ...s, bgBlur: Number(e.target.value) }))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--acc2)]"
            />
            <span className="w-10 text-right text-xs">{fx.bgBlur}px</span>
          </label>
          <label className="chip flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
            <span className="w-20 shrink-0 text-white/55">Затемнение</span>
            <input
              type="range"
              min={0}
              max={95}
              value={fx.bgDim}
              onChange={(e) => setFx((s) => ({ ...s, bgDim: Number(e.target.value) }))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--acc2)]"
            />
            <span className="w-10 text-right text-xs">{fx.bgDim}%</span>
          </label>
        </div>
      )}
    </Section>
  );
}

/* ---------------- sound effects ---------------- */

function SoundSection() {
  const { fx, setFx, play, ready } = useFx();
  if (!ready) return null;
  const PACKS: { key: SoundPack; label: string; hint: string }[] = [
    { key: "off", label: "Выключено", hint: "тишина" },
    { key: "soft", label: "Мягкий", hint: "нежные синусы" },
    { key: "arcade", label: "Аркада", hint: "8-битный ретро" },
    { key: "cosmic", label: "Космос", hint: "长 эмбиентные тона" },
  ];
  return (
    <Section icon={Volume2} title="Звуковые эффекты" hint="Синтезируются в браузере — без внешних файлов">
      <div className="flex flex-wrap gap-2.5">
        {PACKS.map((p) => (
          <button
            key={p.key}
            onClick={() => {
              setFx((s) => ({ ...s, soundPack: p.key }));
              if (p.key !== "off") setTimeout(() => play("success"), 80);
            }}
            className={cx(
              "cursor-pointer rounded-2xl border px-4 py-3 text-left transition-all",
              fx.soundPack === p.key ? "border-white/40 bg-white/10" : "chip hover:border-white/25"
            )}
          >
            <span className="block text-sm font-semibold">{p.label}</span>
            <span className="block text-[11px] text-white/45">{p.hint}</span>
          </button>
        ))}
      </div>
      {fx.soundPack !== "off" && (
        <>
          <label className="chip mt-4 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm">
            <Volume2 className="size-4 shrink-0 text-white/40" />
            <span className="w-20 shrink-0 text-white/55">Громкость</span>
            <input
              type="range"
              min={0}
              max={100}
              value={fx.volume * 100}
              onChange={(e) => setFx((s) => ({ ...s, volume: Number(e.target.value) / 100 }))}
              className="h-1 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[var(--acc2)]"
            />
            <span className="w-10 text-right text-xs">{Math.round(fx.volume * 100)}%</span>
          </label>
          <div className="mt-3 flex flex-wrap gap-2">
            {(["click", "success", "error", "launch", "coin"] as const).map((n) => (
              <button
                key={n}
                onClick={() => play(n)}
                className="chip cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition hover:border-white/25"
              >
                ▶ {n}
              </button>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}

/* ---------------- home widgets ---------------- */

function WidgetSection() {
  const { fx, setFx, ready } = useFx();
  if (!ready) return null;
  const W = [
    { key: "clock" as const, label: "Часы и дата", icon: Clock },
    { key: "weather" as const, label: "Погода", icon: CloudSun },
    { key: "music" as const, label: "Эмбиент-плеер", icon: Music2 },
    { key: "stats" as const, label: "Мини-статистика продаж", icon: Activity },
  ];
  return (
    <Section icon={LayoutGrid} title="Виджеты на главной" hint="Показывать над лентой миров">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {W.map((w) => {
          const on = fx.widgets[w.key];
          const Icon = w.icon;
          return (
            <button
              key={w.key}
              onClick={() => setFx((s) => ({ ...s, widgets: { ...s.widgets, [w.key]: !on } }))}
              className={cx(
                "flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-left transition-all",
                on ? "border-transparent chip-acc" : "chip hover:border-white/25"
              )}
            >
              <Icon className="size-5 shrink-0" style={on ? { color: "var(--acc2)" } : undefined} />
              <span className="flex-1 text-sm font-semibold">{w.label}</span>
              <span
                className={cx(
                  "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                  on ? "bg-[var(--acc1)]" : "bg-white/15"
                )}
              >
                <span
                  className={cx(
                    "absolute top-0.5 size-5 rounded-full bg-white transition-all",
                    on ? "left-[22px]" : "left-0.5"
                  )}
                />
              </span>
            </button>
          );
        })}
      </div>
      {fx.widgets.weather && (
        <input
          value={fx.weatherCity}
          onChange={(e) => setFx((s) => ({ ...s, weatherCity: e.target.value }))}
          placeholder="Город для погоды (пусто — по геолокации)"
          className="chip mt-3 h-11 w-full rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/30"
        />
      )}
    </Section>
  );
}

/* ---------------- discord bot ---------------- */

function DiscordSection() {
  const [cfg, setCfg] = useState<{
    enabled: boolean;
    botName: string;
    configured: boolean;
    webhookMasked: string;
    trackUniverseIds: number[];
    lastSentAt: string | null;
  } | null>(null);
  const [webhook, setWebhook] = useState("");
  const [ids, setIds] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  React.useEffect(() => {
    api<typeof cfg>("/api/discord")
      .then((c) => {
        setCfg(c);
        setIds((c?.trackUniverseIds ?? []).join(", "));
      })
      .catch(() => null);
  }, []);

  const save = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const c = await api<NonNullable<typeof cfg>>("/api/discord", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhook: webhook || undefined,
          enabled: true,
          botName: cfg?.botName,
          trackUniverseIds: ids
            .split(/[,\s]+/)
            .map(Number)
            .filter(Boolean),
        }),
      });
      setCfg({ ...c, lastSentAt: cfg?.lastSentAt ?? null });
      setWebhook("");
      setMsg({ ok: true, text: "Настройки сохранены" });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Ошибка" });
    }
    setBusy(false);
  };

  const send = async (kind: "sales" | "games") => {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/discord", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      setMsg({ ok: true, text: "Отправлено в Discord ✓" });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Не удалось отправить" });
    }
    setBusy(false);
  };

  return (
    <Section icon={Bot} title="Discord-бот" hint="Публикация статистики в ваш Discord-канал через webhook">
      <div className="chip flex items-center gap-2.5 rounded-2xl px-4">
        <Webhook className="size-4 shrink-0 text-white/40" />
        <input
          value={webhook}
          onChange={(e) => setWebhook(e.target.value)}
          placeholder={cfg?.configured ? cfg.webhookMasked : "https://discord.com/api/webhooks/…"}
          className="h-12 w-full bg-transparent font-mono text-xs outline-none placeholder:text-white/30"
        />
      </div>
      <input
        value={ids}
        onChange={(e) => setIds(e.target.value)}
        placeholder="universeId миров для отчёта, через запятую (например 994732206)"
        className="chip mt-2.5 h-11 w-full rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/30"
      />
      <div className="mt-3 flex flex-wrap gap-2.5">
        <button
          onClick={save}
          disabled={busy}
          className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Сохранить
        </button>
        <button
          onClick={() => send("sales")}
          disabled={busy || !cfg?.configured}
          className="btn-acc shine flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold disabled:opacity-50"
        >
          <Send className="size-4" /> Отправить сводку продаж
        </button>
        <button
          onClick={() => send("games")}
          disabled={busy || !cfg?.configured}
          className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
        >
          <Gamepad2 className="size-4" /> Статистика миров
        </button>
      </div>
      {msg && (
        <p className={cx("mt-3 text-sm", msg.ok ? "text-emerald-300" : "text-rose-300")}>{msg.text}</p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-white/40">
        Создайте webhook в Discord: Настройки канала → Интеграции → Веб-хуки → Новый веб-хук → «Копировать
        URL». Токен хранится на сервере и никогда не возвращается в браузер целиком.
      </p>
    </Section>
  );
}

/* ---------------- account sign-in ---------------- */

function AccountSection() {
  const { status, me, login, logout, refresh } = useAuth();
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    const r = await login(input);
    setBusy(false);
    if (!r.ok) setErr(r.error ?? "Не удалось войти");
    else setInput("");
  };

  if (status === "ready" && me) {
    const chips: { icon: React.ElementType; label: string; value: number }[] = [
      { icon: Users, label: "друзей", value: me.counts.friends },
      { icon: BadgeCheck, label: "заявок", value: me.counts.requests },
      { icon: MessageSquare, label: "чатов", value: me.counts.messages },
      { icon: BellRing, label: "уведомлений", value: me.counts.notifications },
    ].filter((c) => c.value > 0);
    return (
      <Section icon={KeyRound} title="Аккаунт Roblox" hint="Вход выполнен — данные запрашиваются от вашего имени">
        <div
          className="flex flex-col gap-5 rounded-2xl p-5 md:flex-row md:items-center"
          style={{
            background: "var(--acc-soft)",
            boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--acc1) 30%, transparent)",
          }}
        >
          <div className="flex items-center gap-4">
            {me.avatar ? (
              <SmartImage src={me.avatar} alt="" className="size-16 rounded-2xl object-cover ring-2 ring-white/20" eager />
            ) : (
              <span className="grid size-16 place-items-center rounded-2xl bg-white/10">
                <UserRound className="size-7" />
              </span>
            )}
            <div>
              <p className="flex items-center gap-2 text-lg font-bold">
                {me.user.displayName}
                {me.user.verified && <BadgeCheck className="size-5 text-sky-400" />}
                {me.premium && (
                  <span className="chip flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: "var(--acc3)" }}>
                    <Gem className="size-3" /> PREMIUM
                  </span>
                )}
              </p>
              <p className="text-sm text-white/50">@{me.user.name} · ID {me.user.id}</p>
              <p className="mt-1.5 flex items-center gap-1.5 font-bold">
                <RobuxIcon className="size-5" style={{ color: "var(--acc2)" }} />
                <span className="font-display text-lg">
                  {typeof me.robux === "number" ? <CountUp value={me.robux} compact={false} /> : "—"}
                </span>
                <span className="text-xs font-normal text-white/45">баланс робуксов</span>
              </p>
            </div>
          </div>
          <div className="flex flex-1 flex-wrap items-center gap-2 md:justify-end">
            {chips.map((c) => {
              const Icon = c.icon;
              return (
                <span key={c.label} className="chip flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1.5 text-xs">
                  <Icon className="size-3.5" style={{ color: "var(--acc2)" }} />
                  <strong>{fmtCompact(c.value)}</strong> {c.label}
                </span>
              );
            })}
            <button onClick={refresh} className="btn-ghost flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold">
              <RefreshCw className="size-4" /> Обновить
            </button>
            <button
              onClick={logout}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-rose-500/85 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-rose-500/25 transition hover:bg-rose-500"
            >
              <LogOut className="size-4" /> Выйти
            </button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section icon={KeyRound} title="Аккаунт Roblox" hint="Войдите, чтобы видеть баланс, заявки в друзья и ленту «Продолжить»">
      <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/8 p-4">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-400" />
        <p className="text-xs leading-relaxed text-white/60">
          У Roblox нет официального входа для сторонних лаунчеров, поэтому вход — через cookie
          <strong className="text-white/85"> .ROBLOSECURITY</strong>. Она хранится{" "}
          <strong className="text-white/85">только в вашем браузере</strong> (localStorage) и используется сервером
          RoLaunch лишь для одиночных запросов к roblox.com — на сервере ничего не сохраняется. Никогда не
          отправляйте cookie другим людям и сайтам. Смена пароля или выход на roblox.com сразу деактивирует её.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="chip flex flex-1 items-center gap-2 rounded-2xl px-4">
          <KeyRound className="size-4 shrink-0 text-white/40" />
          <input
            type={show ? "text" : "password"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Вставьте значение .ROBLOSECURITY"
            autoComplete="off"
            spellCheck={false}
            className="h-12 w-full bg-transparent font-mono text-xs outline-none placeholder:text-white/30"
          />
          <button onClick={() => setShow((v) => !v)} className="cursor-pointer text-white/40 transition hover:text-white" aria-label="Показать">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <button
          onClick={submit}
          disabled={busy || !input.trim()}
          className="btn-acc shine flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-7 py-3 text-sm font-bold disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          Войти
        </button>
      </div>
      {err && (
        <p className="mt-3 flex items-center gap-2 text-sm text-rose-300">
          <AlertTriangle className="size-4" /> {err}
        </p>
      )}
      {status === "loading" && !busy && (
        <p className="mt-3 flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="size-4 animate-spin" /> Проверяем сохранённую сессию…
        </p>
      )}

      <details className="group mt-4 rounded-2xl bg-white/4">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-white/70 transition hover:text-white">
          Как получить cookie? <span className="ml-1 text-white/35 group-open:hidden">(инструкция)</span>
        </summary>
        <ol className="space-y-2 px-4 pb-4 text-xs leading-relaxed text-white/55 [counter-reset:step]">
          <li>1. Откройте roblox.com в браузере и войдите в свой аккаунт.</li>
          <li>2. Нажмите F12 → вкладка <strong>Application</strong> (приложение) → Cookies → https://www.roblox.com.</li>
          <li>3. Найдите строку <strong className="font-mono">.ROBLOSECURITY</strong> — скопируйте колонку Value целиком.</li>
          <li>4. Вставьте значение в поле выше и нажмите «Войти».</li>
          <li>
            5. Для выхода удалите cookie на этой странице. В Firefox: Инспектор → Хранилище → Куки. В Safari: Настройки
            → Конфиденциальность → Управление данными.
          </li>
        </ol>
      </details>
    </Section>
  );
}
