"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { LaunchTarget } from "./shared";

/* ---------------- data fetching ---------------- */

export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((json as { error?: string }).error || `Ошибка ${res.status}`);
  }
  return json as T;
}

interface FetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

export function useFetch<T>(url: string | null, deps: unknown[] = []) {
  const [state, setState] = useState<FetchState<T>>({ data: null, error: null, loading: true });
  const seq = useRef(0);

  const load = useCallback(async () => {
    if (!url) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    const my = ++seq.current;
    setState((s) => ({ ...s, error: null, loading: true }));
    try {
      const data = await api<T>(url);
      if (seq.current === my) setState({ data, error: null, loading: false });
    } catch (e) {
      if (seq.current === my)
        setState({ data: null, error: e instanceof Error ? e.message : "Не удалось загрузить", loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, ...deps]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}

/* ---------------- local storage hook ---------------- */

export function useLocal<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, [key]);

  const set = useCallback(
    (v: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    },
    [key]
  );

  return [value, set, ready] as const;
}

/* ---------------- launching the real client ---------------- */

export function buildLaunchLinks(target: LaunchTarget) {
  const { placeId, jobId } = target;
  const job = jobId ? `&gameInstanceId=${encodeURIComponent(jobId)}` : "";
  const game = jobId ? `&gameId=${encodeURIComponent(jobId)}` : "";
  return {
    scheme: `roblox-player://placeId=${placeId}${job}`,
    ux: `roblox://experiences/start?placeId=${placeId}${game}`,
    web: `https://www.roblox.com/games/${placeId}${jobId ? `?gameInstanceId=${encodeURIComponent(jobId)}` : ""}`,
  };
}

export function fireProtocol(url: string) {
  try {
    const w = window.open(url, "_blank");
    if (!w || w.closed || typeof w.closed === "undefined") {
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = url;
      document.body.appendChild(iframe);
      setTimeout(() => iframe.remove(), 2500);
    } else {
      setTimeout(() => w.close?.(), 1200);
    }
  } catch {
    window.location.href = url;
  }
}

export function copyText(text: string): Promise<boolean> {
  return navigator.clipboard
    ?.writeText(text)
    .then(() => true)
    .catch(() => false);
}
