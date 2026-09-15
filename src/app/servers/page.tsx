"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Server, Plus, Trash2, Play, KeyRound, Link2, Loader2, Info, Pin } from "lucide-react";
import { api, useFetch, buildLaunchLinks } from "@/lib/client";
import { cx } from "@/lib/shared";
import { EmptyState, ErrorView, LoaderView, Page, SectionHeader, SmartImage } from "@/components/ui";
import { useLauncher } from "@/components/launcher";
import { usePageTitle } from "@/components/shell";

interface PrivServer {
  id: number;
  label: string;
  placeId: number;
  universeId: number | null;
  gameName: string | null;
  iconUrl: string | null;
  linkCode: string | null;
  note: string | null;
  createdAt: string;
}

export default function ServersPage() {
  usePageTitle("Приватные серверы");
  const { play } = useLauncher();
  const { data, error, loading, reload } = useFetch<{ servers: PrivServer[] }>("/api/personal?what=servers");
  const [form, setForm] = useState({ label: "", placeId: "", linkCode: "", note: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const parseLink = (raw: string) => {
    // accepts a full share URL or a bare privateServerLinkCode
    const m = raw.match(/privateServerLinkCode=([\w-]+)/i);
    const place = raw.match(/games\/(\d+)/);
    if (place) setForm((f) => ({ ...f, placeId: place[1] }));
    return m ? m[1] : raw.trim();
  };

  const add = async () => {
    if (!form.placeId.trim()) {
      setErr("Укажите placeId или вставьте ссылку на сервер");
      return;
    }
    setBusy(true);
    setErr(null);
    try {
      let gameName: string | null = null;
      let iconUrl: string | null = null;
      let universeId: number | null = null;
      try {
        const g = await api<{ data: { universeId: number; name: string; iconUrl: string | null }[] }>(
          `/api/roblox/games?ids=${form.placeId}&type=place`
        );
        if (g.data?.[0]) {
          gameName = g.data[0].name;
          iconUrl = g.data[0].iconUrl;
          universeId = g.data[0].universeId;
        }
      } catch {
        /* optional enrichment */
      }
      await api("/api/personal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addServer",
          server: {
            label: form.label || gameName || "Приватный сервер",
            placeId: Number(form.placeId),
            universeId,
            gameName,
            iconUrl,
            linkCode: form.linkCode ? parseLink(form.linkCode) : null,
            note: form.note,
          },
        }),
      });
      setForm({ label: "", placeId: "", linkCode: "", note: "" });
      reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Не удалось сохранить");
    }
    setBusy(false);
  };

  const remove = async (id: number) => {
    await api("/api/personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "removeServer", id }),
    });
    reload();
  };

  const join = (s: PrivServer) => {
    if (s.linkCode) {
      window.open(
        `https://www.roblox.com/games/${s.placeId}?privateServerLinkCode=${encodeURIComponent(s.linkCode)}`,
        "_blank",
        "noopener"
      );
      return;
    }
    play({
      placeId: s.placeId,
      universeId: s.universeId ?? undefined,
      name: s.gameName ?? s.label,
      iconUrl: s.iconUrl,
    });
  };

  return (
    <Page className="space-y-7">
      <header>
        <p className="font-display text-[11px] tracking-[0.3em] text-white/40 uppercase">VIP servers</p>
        <h1 className="font-display mt-2 text-3xl font-bold tracking-tight md:text-4xl">
          Приватные <span className="text-gradient">серверы</span>
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Свой список VIP-серверов с подключением в один клик
        </p>
      </header>

      <section className="glass rounded-[26px] p-5 md:p-6">
        <SectionHeader title="Добавить сервер" hint="Вставьте ссылку-приглашение или укажите placeId" />
        <div className="grid gap-2.5 md:grid-cols-2">
          <input
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            placeholder="Название (например «Сервер друзей»)"
            className="chip h-12 rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/30"
          />
          <input
            value={form.placeId}
            onChange={(e) => setForm({ ...form, placeId: e.target.value.replace(/\D/g, "") })}
            placeholder="placeId, например 2753915549"
            className="chip h-12 rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/30"
          />
          <div className="chip flex items-center gap-2.5 rounded-2xl px-4 md:col-span-2">
            <Link2 className="size-4 shrink-0 text-white/40" />
            <input
              value={form.linkCode}
              onChange={(e) => {
                const v = e.target.value;
                setForm((f) => ({ ...f, linkCode: v }));
                if (v.includes("games/")) parseLink(v);
              }}
              placeholder="Ссылка-приглашение или privateServerLinkCode (необязательно)"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
          </div>
          <input
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Заметка (пароль от рп, расписание…)"
            className="chip h-12 rounded-2xl bg-transparent px-4 text-sm outline-none placeholder:text-white/30 md:col-span-2"
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            onClick={add}
            disabled={busy}
            className="btn-acc shine flex cursor-pointer items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold disabled:opacity-50"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Сохранить сервер
          </button>
          {err && <p className="text-sm text-rose-300">{err}</p>}
        </div>
        <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-white/40">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          Ссылку можно скопировать на странице игры Roblox → «Серверы» → ваш VIP-сервер → «Пригласить». Код
          хранится локально в вашей базе лаунчера.
        </p>
      </section>

      {loading && !data ? (
        <LoaderView label="Загружаем серверы…" />
      ) : error ? (
        <ErrorView message={error} onRetry={reload} />
      ) : !data?.servers.length ? (
        <EmptyState
          icon={Server}
          title="Список пуст"
          hint="Добавьте первый приватный сервер — он появится здесь с кнопкой быстрого входа"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {data.servers.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 9) * 0.05 }}
              className="glass card-hover shine group relative overflow-hidden rounded-[22px] p-4"
            >
              <div className="flex items-start gap-3.5">
                <SmartImage src={s.iconUrl} alt="" className="size-14 shrink-0 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{s.label}</p>
                  <p className="truncate text-xs text-white/45">{s.gameName ?? `place ${s.placeId}`}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {s.linkCode ? (
                      <span className="chip flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] text-emerald-300">
                        <KeyRound className="size-2.5" /> код есть
                      </span>
                    ) : (
                      <span className="chip rounded-full px-2 py-0.5 text-[10px] text-white/40">публичный вход</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => remove(s.id)}
                  className="cursor-pointer text-white/25 opacity-0 transition group-hover:opacity-100 hover:text-rose-400"
                  aria-label="Удалить"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              {s.note && <p className="mt-2.5 line-clamp-2 text-xs text-white/45">{s.note}</p>}
              <button
                onClick={() => join(s)}
                className={cx("btn-acc shine mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold")}
              >
                <Play className="size-4 fill-current" /> Подключиться
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </Page>
  );
}

export const _u = { buildLaunchLinks, Pin };
