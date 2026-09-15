"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home,
  Trophy,
  ShoppingBag,
  Hammer,
  Gem,
  LibraryBig,
  Settings,
  Search,
  X,
  Users,
  Gamepad2,
  Loader2,
  CornerDownLeft,
  UserRound,
  Command,
  LogIn,
  UsersRound,
  Server,
  BarChart3,
  Tags,
  Coins,
  Receipt,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ComponentType, CSSProperties } from "react";
import { cx, fmtCompact, type ProfilePayload, type SearchPayload } from "@/lib/shared";
import { api, useFetch } from "@/lib/client";
import { useStore } from "@/components/store";
import { useAuth, openLogin } from "@/components/auth";
import { LogoMark, RobuxIcon } from "@/components/icons";

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — RoLaunch`;
  }, [title]);
}

/* ---------------- background ---------------- */

function BackdropFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div
        className="aurora-blob top-[-12%] left-[8%] h-[46vh] w-[44vw]"
        style={{ background: "radial-gradient(circle, var(--acc1), transparent 65%)" }}
      />
      <div
        className="aurora-blob top-[30%] right-[-8%] h-[42vh] w-[38vw]"
        style={{ background: "radial-gradient(circle, var(--acc2), transparent 65%)", animationDelay: "-8s" }}
      />
      <div
        className="aurora-blob bottom-[-16%] left-[30%] h-[44vh] w-[42vw]"
        style={{ background: "radial-gradient(circle, var(--acc3), transparent 62%)", animationDelay: "-15s", opacity: 0.22 }}
      />
      <div
        className="absolute inset-0 opacity-[0.32]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 70% at 50% 0%, #000 40%, transparent)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_-8%,rgba(255,255,255,0.06),transparent)]" />
    </div>
  );
}

/* ---------------- splash ---------------- */

function Splash() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] grid place-items-center"
          style={{ background: "var(--bg)" }}
          exit={{ opacity: 0, filter: "blur(12px)" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex flex-col items-center gap-6">
            <motion.div
              initial={{ scale: 0.5, rotate: -14, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 14 }}
            >
              <LogoMark className="size-24 drop-shadow-[0_0_40px_var(--acc-soft)]" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-display text-sm tracking-[0.35em] text-white/60 uppercase"
            >
              RoLaunch
            </motion.p>
            <motion.div
              className="h-1 w-44 overflow-hidden rounded-full bg-white/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, var(--acc1), var(--acc2))" }}
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------------- navigation ---------------- */

type NavIcon = ComponentType<{ className?: string; style?: CSSProperties }>;

const NAV: { href: string; label: string; icon: NavIcon; exact?: boolean }[] = [
  { href: "/", label: "Главная", icon: Home, exact: true },
  { href: "/charts", label: "Чарты", icon: Trophy },
  { href: "/catalog", label: "Магазин", icon: ShoppingBag },
  { href: "/groups", label: "Группы", icon: UsersRound },
  { href: "/servers", label: "Приватные", icon: Server },
  { href: "/premium", label: "Премиум", icon: Gem },
  { href: "/robux", label: "Robux", icon: RobuxIcon },
  { href: "/library", label: "Библиотека", icon: LibraryBig },
];

const STUDIO_NAV: { href: string; label: string; icon: NavIcon }[] = [
  { href: "/studio/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/studio/pricing", label: "Цены", icon: Tags },
  { href: "/studio/payouts", label: "Выплаты", icon: Coins },
  { href: "/transactions", label: "Транзакции", icon: Receipt },
  { href: "/create", label: "Roblox Studio", icon: Hammer },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(href + "/");
}

function Sidebar({ onSearch }: { onSearch: () => void }) {
  const pathname = usePathname();
  const { settings } = useStore();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-white/8 bg-[#0a0a13]/80 backdrop-blur-2xl lg:flex">
      <Link href="/" className="group flex items-center gap-3 px-6 pt-7 pb-4">
        <LogoMark className="size-10 transition-transform duration-500 group-hover:rotate-[8deg]" />
        <div>
          <p className="font-display text-[17px] leading-none font-semibold tracking-wide">
            RO<span className="text-gradient">LAUNCH</span>
          </p>
          <p className="mt-1.5 text-[10px] tracking-[0.28em] text-white/40 uppercase">Roblox client</p>
        </div>
      </Link>

      <button
        onClick={onSearch}
        className="chip mx-5 mt-2 flex cursor-pointer items-center gap-2.5 rounded-2xl px-4 py-2.5 text-sm text-white/55 transition hover:border-white/25 hover:text-white"
      >
        <Search className="size-4" />
        <span className="flex-1 text-left">Поиск миров…</span>
        <kbd className="flex items-center gap-0.5 rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] text-white/60">
          <Command className="size-2.5" />K
        </kbd>
      </button>

      <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-4 pb-4">
        {NAV.map((item) => {
          const active = isActive(pathname, item.href, item.exact);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-300",
                active ? "text-white" : "text-white/55 hover:translate-x-1 hover:text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-2xl border border-white/12 bg-white/8"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <span
                className={cx(
                  "absolute inset-y-2 left-0 w-[3px] rounded-full transition-opacity duration-300",
                  active ? "opacity-100" : "opacity-0"
                )}
                style={{ background: "linear-gradient(180deg, var(--acc1), var(--acc2))" }}
              />
              <Icon
                className={cx("relative size-[18px] transition-colors", active && "text-(--acc2)")}
                style={active ? { color: "var(--acc2)" } : undefined}
              />
              <span className="relative flex-1">{item.label}</span>
            </Link>
          );
        })}

        <p className="px-4 pt-5 pb-1.5 text-[10px] tracking-[0.28em] text-white/30 uppercase">
          Мастерская
        </p>
        {STUDIO_NAV.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                "group relative flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-300",
                active ? "text-white" : "text-white/50 hover:translate-x-1 hover:text-white"
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill-studio"
                  className="absolute inset-0 rounded-2xl border border-white/12 bg-white/8"
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                />
              )}
              <Icon
                className="relative size-[17px]"
                style={active ? { color: "var(--acc2)" } : undefined}
              />
              <span className="relative flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/8 p-4">
        <Link
          href="/settings"
          className={cx(
            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition hover:text-white",
            isActive(pathname, "/settings") ? "bg-white/8 text-white" : "text-white/55"
          )}
        >
          <Settings className="size-[18px]" /> Настройки
        </Link>
        <SidebarProfile username={settings.username} />
        <VersionChip />
      </div>
    </aside>
  );
}

function SidebarProfile({ username }: { username: string }) {
  const { me, status } = useAuth();
  const { data } = useFetch<ProfilePayload>(
    !me && username ? `/api/roblox/user/${encodeURIComponent(username)}` : null
  );
  if (status === "loading") {
    return <div className="skeleton mt-3 h-14 rounded-2xl" />;
  }
  if (me) {
    return (
      <Link
        href={`/profile/${encodeURIComponent(me.user.name)}`}
        className="group mt-3 flex items-center gap-3 rounded-2xl p-3 transition hover:bg-white/9"
        style={{ background: "var(--acc-soft)", boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--acc1) 30%, transparent)" }}
      >
        {me.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={me.avatar} alt="" className="size-9 rounded-full ring-2 ring-white/20" />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-white/10">
            <UserRound className="size-4" />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{me.user.displayName}</span>
          <span className="block truncate text-[11px] text-white/50">@{me.user.name}</span>
        </span>
        {typeof me.robux === "number" && (
          <span className="chip flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[11px] font-bold">
            <RobuxIcon className="size-3" style={{ color: "var(--acc2)" }} />
            {fmtCompact(me.robux)}
          </span>
        )}
      </Link>
    );
  }
  if (!username) {
    return (
      <div className="mt-3 space-y-2">
        <button
          onClick={openLogin}
          className="btn-acc shine flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold"
        >
          <LogIn className="size-4" /> Войти в аккаунт
        </button>
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-2xl bg-white/4 p-3 transition hover:bg-white/8"
        >
          <span className="grid size-9 place-items-center rounded-full bg-white/10">
            <UserRound className="size-4" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold">Гость</span>
            <span className="block truncate text-[11px] text-white/45">или укажите ник для просмотра</span>
          </span>
        </Link>
      </div>
    );
  }
  return (
    <div className="mt-3 space-y-2">
      <Link
        href={`/profile/${encodeURIComponent(username)}`}
        className="flex items-center gap-3 rounded-2xl bg-white/4 p-3 transition hover:bg-white/8"
      >
        {data?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.avatar} alt="" className="size-9 rounded-full ring-2 ring-white/15" />
        ) : (
          <span className="grid size-9 place-items-center rounded-full bg-white/10">
            <UserRound className="size-4" />
          </span>
        )}
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold">{data?.user.displayName ?? username}</span>
          <span className="block truncate text-[11px] text-white/45">@{data?.user.name ?? username}</span>
        </span>
      </Link>
      <button
        onClick={openLogin}
        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl py-2 text-xs font-semibold text-white/55 transition hover:text-white"
        style={{ background: "var(--acc-soft)" }}
      >
        <LogIn className="size-3.5" /> Войти в аккаунт
      </button>
    </div>
  );
}

function VersionChip() {
  const { data } = useFetch<{ player: { version: string } }>("/api/roblox/version");
  return (
    <p className="mt-3 px-2 text-[10px] tracking-wider text-white/30">
      {data?.player?.version ? `CLIENT v${data.player.version}` : "CLIENT v————"}
    </p>
  );
}

/* ---------------- topbar + palette ---------------- */

function Topbar({ onSearch }: { onSearch: () => void }) {
  const { settings } = useStore();
  const { me } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0a0a13]/70 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 lg:hidden">
          <LogoMark className="size-8" />
          <span className="font-display text-sm font-semibold tracking-wide">
            RO<span className="text-gradient">LAUNCH</span>
          </span>
        </Link>
        <button
          onClick={onSearch}
          className="chip hidden max-w-md flex-1 cursor-pointer items-center gap-2.5 rounded-2xl px-4 py-2 text-sm text-white/50 transition hover:border-white/25 hover:text-white lg:flex"
        >
          <Search className="size-4" /> Найти игру, игрока, вещь…
        </button>
        <button
          onClick={onSearch}
          className="btn-ghost grid size-10 cursor-pointer place-items-center rounded-2xl lg:hidden"
          aria-label="Поиск"
        >
          <Search className="size-4" />
        </button>
        <div className="flex-1 lg:hidden" />
        <div className="ml-auto flex items-center gap-2.5">
          <Link
            href="/robux"
            className="btn-ghost shine flex items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold"
          >
            <RobuxIcon className="size-4" style={{ color: "var(--acc2)" }} />
            <span className="hidden sm:inline">Robux</span>
          </Link>
          <Link
            href="/premium"
            className="chip hidden items-center gap-2 rounded-2xl px-3.5 py-2 text-sm font-semibold md:flex"
          >
            <Gem className="size-4" style={{ color: "var(--acc3)" }} /> Премиум
          </Link>
          {me ? (
            <Link
              href={`/profile/${encodeURIComponent(me.user.name)}`}
              className="btn-acc grid size-10 place-items-center overflow-hidden rounded-2xl"
              aria-label="Профиль"
            >
              {me.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={me.avatar} alt="" className="size-full object-cover" />
              ) : (
                <UserRound className="size-4.5" />
              )}
            </Link>
          ) : (
            <button
              onClick={settings.username ? undefined : openLogin}
              className="btn-acc grid size-10 cursor-pointer place-items-center overflow-hidden rounded-2xl"
              aria-label="Войти в аккаунт"
              title={settings.username ? `@${settings.username} (гостевой режим)` : "Войти в аккаунт"}
            >
              <UserRound className="size-4.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setDebounced("");
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, loading } = useFetch<SearchPayload>(
    debounced ? `/api/roblox/search?q=${encodeURIComponent(debounced)}` : null
  );

  const go = (path: string) => {
    onClose();
    router.push(path);
  };

  const hot = useMemo(
    () => ["Blox Fruits", "Brookhaven", "Grow a Garden", "Blade Ball", "DOORS", "Builderman"],
    []
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="glass-strong relative w-full max-w-xl overflow-hidden rounded-[24px]"
          >
            <div className="flex items-center gap-3 border-b border-white/8 px-5">
              <Search className="size-4.5 text-white/40" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
                  if (e.key === "Escape") onClose();
                }}
                placeholder="Миры, игроки, плейсы…"
                className="h-14 flex-1 bg-transparent text-[15px] outline-none placeholder:text-white/35"
              />
              {loading ? (
                <Loader2 className="size-4 animate-spin text-white/40" />
              ) : (
                <button
                  onClick={onClose}
                  className="btn-ghost grid size-8 cursor-pointer place-items-center rounded-full"
                  aria-label="Закрыть поиск"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-[52vh] overflow-y-auto p-3">
              {!debounced && (
                <div className="p-2">
                  <p className="px-2 pb-2 text-[11px] tracking-[0.2em] text-white/40 uppercase">Сейчас в тренде</p>
                  <div className="flex flex-wrap gap-2">
                    {hot.map((h) => (
                      <button
                        key={h}
                        onClick={() => setQ(h)}
                        className="chip cursor-pointer rounded-full px-3.5 py-1.5 text-xs text-white/70 transition hover:border-white/25 hover:text-white"
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {debounced && data && !data.games.length && !data.users.length && !loading && (
                <p className="p-6 text-center text-sm text-white/45">
                  Ничего не нашлось по запросу «{debounced}»
                </p>
              )}

              {data?.games.length ? (
                <div className="p-1">
                  <p className="px-3 pt-2 pb-1.5 text-[11px] tracking-[0.2em] text-white/40 uppercase">
                    <Gamepad2 className="mr-1.5 inline size-3.5" />
                    Миры
                  </p>
                  {data.games.slice(0, 6).map((g) => (
                    <button
                      key={g.universeId}
                      onClick={() => go(`/game/${g.universeId}`)}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/7"
                    >
                      {g.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={g.iconUrl} alt="" className="size-9 rounded-lg object-cover" />
                      ) : (
                        <span className="grid size-9 place-items-center rounded-lg bg-white/8">
                          <Gamepad2 className="size-4" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{g.name}</span>
                        <span className="block truncate text-xs text-white/45">{g.creatorName}</span>
                      </span>
                      <span className="flex items-center gap-1 text-xs text-white/50">
                        <Users className="size-3" /> {fmtCompact(g.playing)}
                      </span>
                    </button>
                  ))}
                </div>
              ) : null}

              {data?.users.length ? (
                <div className="p-1">
                  <p className="px-3 pt-2 pb-1.5 text-[11px] tracking-[0.2em] text-white/40 uppercase">
                    <Users className="mr-1.5 inline size-3.5" />
                    Игроки
                  </p>
                  <div className="grid grid-cols-2 gap-1">
                    {data.users.slice(0, 4).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => go(`/profile/${encodeURIComponent(u.name)}`)}
                        className="flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2 text-left transition hover:bg-white/7"
                      >
                        {u.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar} alt="" className="size-8 rounded-full" />
                        ) : (
                          <span className="grid size-8 place-items-center rounded-full bg-white/8">
                            <UserRound className="size-3.5" />
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">{u.displayName}</span>
                          <span className="block truncate text-xs text-white/45">@{u.name}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-4 border-t border-white/8 px-5 py-2.5 text-[11px] text-white/35">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/8 px-1.5 py-0.5">
                  <CornerDownLeft className="inline size-2.5" />
                </kbd>
                все результаты
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded bg-white/8 px-1.5 py-0.5">esc</kbd>
                закрыть
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const items: { href: string; label: string; icon: NavIcon; exact?: boolean }[] = [
    ...NAV.filter((n) => ["/", "/charts", "/catalog", "/library"].includes(n.href)),
    { href: "/settings", label: "Ещё", icon: Settings },
  ];
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 gap-1 rounded-3xl border border-white/10 bg-[#0c0c16]/85 p-2 backdrop-blur-2xl lg:hidden">
      {items.map((item) => {
        const active =
          item.href === "/settings"
            ? isActive(pathname, item.href)
            : isActive(pathname, item.href, item.exact);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cx(
              "flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-medium transition",
              active ? "bg-white/10 text-white" : "text-white/45"
            )}
          >
            <Icon className="size-[18px]" style={active ? { color: "var(--acc2)" } : undefined} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

/* ---------------- shell ---------------- */

export function Shell({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { settings } = useStore();

  useEffect(() => {
    document.documentElement.dataset.accent = settings.accent;
    document.documentElement.dataset.motion = settings.motion;
  }, [settings.accent, settings.motion]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Splash />
      <BackdropFX />
      <Sidebar onSearch={() => setPaletteOpen(true)} />
      <div className="lg:pl-[264px]">
        <Topbar onSearch={() => setPaletteOpen(true)} />
        <main className="mx-auto max-w-[1500px] px-4 pt-6 pb-28 md:px-8 lg:pb-16">{children}</main>
        <Footer />
      </div>
      <MobileNav />
      <SearchPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-[1500px] px-4 pb-28 md:px-8 lg:pb-10">
      <div className="glass flex flex-col gap-4 rounded-3xl p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <LogoMark className="size-8" />
          <div>
            <p className="font-display text-xs font-semibold tracking-[0.3em]">ROLAUNCH</p>
            <p className="mt-0.5 text-xs text-white/40">
              Сделано с любовью к метавселенной · данные — Roblox Web API
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
          <a href="https://www.roblox.com" target="_blank" rel="noreferrer" className="transition hover:text-white">roblox.com</a>
          <a href="https://en.help.roblox.com" target="_blank" rel="noreferrer" className="transition hover:text-white">Помощь</a>
          <a href="https://create.roblox.com/docs" target="_blank" rel="noreferrer" className="transition hover:text-white">Документация</a>
          <a href="https://status.roblox.com" target="_blank" rel="noreferrer" className="transition hover:text-white">Статус</a>
        </div>
      </div>
      <p className="mt-4 px-2 text-[11px] leading-relaxed text-white/30">
        RoLaunch — неофициальный фанатский лаунчер. Roblox и связанные товарные знаки принадлежат
        Roblox Corporation.
      </p>
    </footer>
  );
}
