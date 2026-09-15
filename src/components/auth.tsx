"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Globe,
  KeyRound,
  LogIn,
  Loader2,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  ClipboardPaste,
  CheckCircle2,
  UserRound,
  ArrowRight,
} from "lucide-react";
import type { MePayload } from "@/lib/shared";
import { api } from "@/lib/client";
import { useStore } from "@/components/store";
import { LogoMark, RobuxIcon } from "@/components/icons";

export type AuthStatus = "boot" | "guest" | "loading" | "ready" | "error";

interface AuthShape {
  status: AuthStatus;
  me: MePayload | null;
  error: string | null;
  login: (cookieValue: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthShape>({
  status: "boot",
  me: null,
  error: null,
  login: async () => ({ ok: false }),
  logout: () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(Ctx);

/* ---- helper to open the login window from anywhere ---- */
export function openLogin() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("rolaunch:login"));
}

async function requestMe(token: string): Promise<{ data: MePayload | null; message: string | null }> {
  try {
    const data = await api<MePayload>("/api/roblox/me", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookie: token }),
      cache: "no-store",
    });
    return { data, message: null };
  } catch (e) {
    return { data: null, message: e instanceof Error ? e.message : "Ошибка сети" };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { settings, setSettings } = useStore();
  const cookie = settings.cookie || "";
  const [status, setStatus] = useState<AuthStatus>("boot");
  const [me, setMe] = useState<MePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let dead = false;
    if (!cookie) {
      setStatus("guest");
      setMe(null);
      return;
    }
    setStatus("loading");
    requestMe(cookie).then(({ data, message }) => {
      if (dead) return;
      if (data) {
        setMe(data);
        setError(null);
        setStatus("ready");
      } else {
        setMe(null);
        setError(message);
        setStatus("guest");
        // invalid stored session — drop it
        setSettings((s) => ({ ...s, cookie: "" }));
      }
    });
    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cookie]);

  const login = useCallback(
    async (cookieValue: string) => {
      const token = cookieValue.trim();
      if (!token) return { ok: false as const, error: "Вставьте значение cookie" };
      setStatus("loading");
      setError(null);
      const { data, message } = await requestMe(token);
      if (!data) {
        setStatus("guest");
        setError(message);
        return { ok: false as const, error: message ?? "Cookie не подошла" };
      }
      setSettings((s) => ({ ...s, cookie: token, username: s.username || data.user.name }));
      return { ok: true as const };
    },
    [setSettings]
  );

  const logout = useCallback(() => {
    setSettings((s) => ({ ...s, cookie: "" }));
    setMe(null);
    setError(null);
    setStatus("guest");
  }, [setSettings]);

  const refresh = useCallback(async () => {
    if (!cookie) return;
    const { data } = await requestMe(cookie);
    if (data) {
      setMe(data);
      setError(null);
    }
  }, [cookie]);

  const value = useMemo(
    () => ({ status, me, error, login, logout, refresh }),
    [status, me, error, login, logout, refresh]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <LoginModalPortal />
    </Ctx.Provider>
  );
}

/* ================= the Login window ================= */

const ROBLOX_LOGIN_URL = "https://www.roblox.com/login";

function LoginModalPortal() {
  const { status, me, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"roblox" | "cookie">("roblox");

  useEffect(() => {
    const handler = () => {
      setTab("roblox");
      setOpen(true);
    };
    window.addEventListener("rolaunch:login", handler);
    return () => window.removeEventListener("rolaunch:login", handler);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/75 backdrop-blur-md" onClick={close} />
          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="glass-strong relative w-full max-w-lg overflow-hidden rounded-[28px]"
          >
            <div
              className="pointer-events-none absolute -top-28 left-1/2 h-52 w-[130%] -translate-x-1/2 opacity-35 blur-3xl"
              style={{ background: "linear-gradient(120deg, var(--acc1), var(--acc2), var(--acc3))" }}
            />
            <button
              onClick={close}
              className="btn-ghost absolute top-4 right-4 z-10 grid size-9 cursor-pointer place-items-center rounded-full"
              aria-label="Закрыть"
            >
              <X className="size-4" />
            </button>

            <div className="relative p-7">
              <div className="flex items-center gap-3.5">
                <LogoMark className="size-11" />
                <div>
                  <h3 className="font-display text-lg font-bold">Вход в аккаунт</h3>
                  <p className="text-xs text-white/45">баланс, друзья и лента «Продолжить» — в вашем лаунчере</p>
                </div>
              </div>

              {status === "ready" && me ? (
                <SignedInPanel onLogout={() => { logout(); close(); }} onClose={close} me={me} />
              ) : (
                <>
                  <div className="chip mt-6 grid grid-cols-2 gap-1 rounded-2xl p-1.5">
                    {(
                      [
                        { key: "roblox", label: "Логин и пароль", icon: Globe },
                        { key: "cookie", label: "Cookie", icon: KeyRound },
                      ] as const
                    ).map((t) => {
                      const Icon = t.icon;
                      const active = tab === t.key;
                      return (
                        <button
                          key={t.key}
                          onClick={() => setTab(t.key)}
                          className={
                            "relative flex cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors " +
                            (active ? "text-white" : "text-white/50 hover:text-white/80")
                          }
                        >
                          {active && (
                            <motion.span
                              layoutId="login-tab"
                              className="chip-acc absolute inset-0 rounded-xl"
                              transition={{ type: "spring", stiffness: 460, damping: 36 }}
                            />
                          )}
                          <Icon className="relative size-4" />
                          <span className="relative">{t.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence mode="wait">
                    {tab === "roblox" ? (
                      <motion.div
                        key="roblox"
                        initial={{ opacity: 0, x: 14 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -14 }}
                        transition={{ duration: 0.25 }}
                        className="mt-5 space-y-4"
                      >
                        <div className="flex items-start gap-3 rounded-2xl border border-sky-400/20 bg-sky-400/8 p-4">
                          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-sky-400" />
                          <p className="text-xs leading-relaxed text-white/60">
                            Логин и пароль вводятся <strong className="text-white/85">только на оригинальной
                            странице roblox.com</strong>. RoLaunch никогда не попросит ваш пароль — откроется
                            настоящая форма входа Roblox в отдельном окне.
                          </p>
                        </div>

                        <ol className="space-y-2.5 text-sm text-white/65">
                          <li className="flex gap-2.5">
                            <span className="font-display w-5 shrink-0 font-bold" style={{ color: "var(--acc2)" }}>1</span>
                            Откройте оригинальную страницу входа Roblox
                          </li>
                          <li className="flex gap-2.5">
                            <span className="font-display w-5 shrink-0 font-bold" style={{ color: "var(--acc2)" }}>2</span>
                            Войдите в аккаунт там (можно прямо в открытом окне)
                          </li>
                          <li className="flex gap-2.5">
                            <span className="font-display w-5 shrink-0 font-bold" style={{ color: "var(--acc2)" }}>3</span>
                            Вернитесь и перенесите сессию во вкладке «Cookie» — один раз
                          </li>
                        </ol>

                        <button
                          onClick={() =>
                            window.open(ROBLOX_LOGIN_URL, "roblox-login", "width=560,height=760,menubar=no,toolbar=no")
                          }
                          className="btn-acc shine flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl px-6 py-4 text-base font-bold"
                        >
                          <Globe className="size-5" />
                          Открыть страницу входа Roblox
                        </button>

                        <button
                          onClick={() => setTab("cookie")}
                          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-2 text-sm font-semibold text-white/55 transition hover:text-white"
                        >
                          Я уже вошёл — перенести сессию <ArrowRight className="size-4" />
                        </button>
                      </motion.div>
                    ) : (
                      <CookieTab key="cookie" login={login} onDone={close} />
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function CookieTab({
  login,
  onDone,
}: {
  login: AuthShape["login"];
  onDone: () => void;
}) {
  const [input, setInput] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pasted, setPasted] = useState(false);

  const submit = async (value?: string) => {
    const token = (value ?? input).trim();
    if (!token || busy) return;
    setBusy(true);
    setErr(null);
    const r = await login(token);
    setBusy(false);
    if (r.ok) onDone();
    else setErr(r.error ?? "Cookie не подошла");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 14 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -14 }}
      transition={{ duration: 0.25 }}
      className="mt-5 space-y-3.5"
    >
      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/20 bg-amber-400/8 p-3.5">
        <ShieldAlert className="mt-0.5 size-4.5 shrink-0 text-amber-400" />
        <p className="text-[11px] leading-relaxed text-white/55">
          Cookie хранится только в вашем браузере и используется для единичных запросов к roblox.com. Никогда не
          отправляйте её другим людям и сайтам. Смена пароля деактивирует сессию.
        </p>
      </div>

      <div className="chip flex items-center gap-2 rounded-2xl px-4">
        <KeyRound className="size-4 shrink-0 text-white/40" />
        <input
          type={show ? "text" : "password"}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setErr(null);
            setPasted(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          onPaste={() => setPasted(true)}
          placeholder="Значение .ROBLOSECURITY"
          autoComplete="off"
          spellCheck={false}
          className="h-12 w-full bg-transparent font-mono text-xs outline-none placeholder:text-white/30"
        />
        {(pasted || input) && (
          <button className="cursor-pointer text-white/40 transition hover:text-white" onClick={() => setShow((v) => !v)} aria-label="Показать">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        )}
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={async () => {
            try {
              const text = await navigator.clipboard.readText();
              if (text) {
                setInput(text);
                setPasted(true);
                void submit(text);
              }
            } catch {
              setErr("Браузер не дал доступ к буферу — вставьте вручную (Ctrl+V)");
            }
          }}
          className="btn-ghost flex cursor-pointer items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold"
        >
          <ClipboardPaste className="size-4" /> Из буфера
        </button>
        <button
          onClick={() => submit()}
          disabled={busy || !input.trim()}
          className="btn-acc shine flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold disabled:opacity-50"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
          Войти
        </button>
      </div>

      {err && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-rose-400/25 bg-rose-400/8 p-3 text-xs leading-relaxed text-rose-200"
        >
          {err}
        </motion.p>
      )}

      <ol className="space-y-1.5 pt-1 text-[11px] leading-relaxed text-white/40">
        <li>1. Нажмите «Открыть страницу Roblox», войдите там в аккаунт.</li>
        <li>2. На roblox.com нажмите F12 → Application → Cookies → https://www.roblox.com.</li>
        <li>3. Скопируйте Value строки <strong className="font-mono">.ROBLOSECURITY</strong> целиком (начинается с _|WARNING:).</li>
        <li>4. Нажмите «Из буфера» здесь — лаунчер сам подхватит и войдёт.</li>
      </ol>
    </motion.div>
  );
}

function SignedInPanel({
  me,
  onLogout,
  onClose,
}: {
  me: MePayload;
  onLogout: () => void;
  onClose: () => void;
}) {
  return (
    <div className="mt-6 space-y-4">
      <div
        className="flex items-center gap-4 rounded-2xl p-4"
        style={{
          background: "var(--acc-soft)",
          boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--acc1) 30%, transparent)",
        }}
      >
        {me.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.avatar} alt="" className="size-14 rounded-2xl ring-2 ring-white/20" />
        ) : (
          <span className="grid size-14 place-items-center rounded-2xl bg-white/10">
            <UserRound className="size-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-bold">
            <CheckCircle2 className="size-4.5 text-emerald-400" />
            {me.user.displayName}
          </p>
          <p className="text-sm text-white/50">@{me.user.name}</p>
          {typeof me.robux === "number" && (
            <p className="mt-1 flex items-center gap-1.5 text-sm font-bold">
              <RobuxIcon className="size-4" style={{ color: "var(--acc2)" }} />
              {new Intl.NumberFormat("ru-RU").format(me.robux)}
            </p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={onClose} className="btn-acc shine cursor-pointer rounded-2xl px-4 py-3 text-sm font-bold">
          Готово
        </button>
        <button
          onClick={onLogout}
          className="cursor-pointer rounded-2xl bg-rose-500/85 px-4 py-3 text-sm font-bold shadow-lg shadow-rose-500/25 transition hover:bg-rose-500"
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
