/* Authenticated access to Roblox on behalf of the signed-in user.
 * The .ROBLOSECURITY cookie is supplied per-request by the client,
 * is used ONLY to call roblox.com and is never persisted server-side.
 * (We keep a short in-memory session validation + tiny data cache keyed
 * by a hash of the cookie so the UI can refresh quickly.)
 */
import { createHash } from "crypto";

const SESSION_TTL = 90_000;
const DATA_TTL = 30_000;
const sessions = new Map<string, { t: number; user: any }>();
const dataCache = new Map<string, { t: number; data: any }>();

export function sanitizeCookie(raw: string): string {
  let v = raw.trim();

  // URL-decoded forms ("%" escapes) — decode once if it looks encoded
  if (v.includes("%")) {
    try {
      const d = decodeURIComponent(v);
      if (d && !d.includes(";")) v = d.trim();
    } catch {
      /* keep raw */
    }
  }

  // whole `document.cookie` dump or header line pasted → extract ours
  const m = v.match(/\.?ROBLOSECURITY=(?:"([^"]*)"|([^;\s]+))/i);
  if (m) v = m[1] ?? m[2] ?? v;

  // plain "Name=Value" / quoted paste
  v = v.replace(/^\.?ROBLOSECURITY=/i, "");
  v = v.replace(/^["'\s]+|["'\s;]+$/g, "");

  // browsers sometimes show the value url-encoded even after a header-paste
  if (v.includes("%")) {
    try {
      const d = decodeURIComponent(v);
      if (d) v = d;
    } catch {
      /* keep raw */
    }
  }
  return v.trim();
}

const hash = (c: string) => createHash("sha256").update(c).digest("hex");

async function call(cookie: string, sub: string, path: string, init?: RequestInit) {
  const hosts = [`https://${sub}.roblox.com`, `https://${sub}.roproxy.com`];
  let lastErr: any = null;
  let authErr: any = null; // first 401/403 — the most meaningful diagnostic
  for (const base of hosts) {
    try {
      const res = await fetch(base + path, {
        ...init,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "RoLaunch/1.0 (+launcher)",
          Cookie: `.ROBLOSECURITY=${cookie}`,
          ...(init?.headers ?? {}),
        },
        signal: AbortSignal.timeout(9000),
        cache: "no-store",
      });
      if (!res.ok) {
        // capture upstream error detail (code/subcode) for honest diagnostics
        let detail = "";
        try {
          const body = await res.json();
          const e0 = body?.errors?.[0];
          if (e0) detail = `${e0.code}${e0.subcode ? `/${e0.subcode}` : ""}`;
        } catch {
          /* ignore */
        }
        const err = Object.assign(new Error(`${sub} ${res.status}`), {
          status: res.status,
          detail,
          host: base,
        });
        if (!authErr && (res.status === 401 || res.status === 403)) authErr = err;
        lastErr = err;
        // keep trying the mirror even on auth errors — its egress IP
        // pool sometimes passes where the direct one is rejected
        continue;
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
    }
  }
  throw authErr ?? (lastErr instanceof Error ? lastErr : new Error("auth request failed"));
}

export interface AuthedIdentity {
  id: number;
  name: string;
  displayName: string;
}

export type CookieCheck =
  | { ok: true; user: AuthedIdentity }
  | { ok: false; reason: string };

export async function validateCookie(cookie: string): Promise<CookieCheck> {
  if (!cookie) return { ok: false, reason: "Поле пустое — вставьте значение cookie" };
  if (cookie.length < 40)
    return {
      ok: false,
      reason: `Строка слишком короткая (${cookie.length} символов из ~200). Скопируйте значение .ROBLOSECURITY целиком, включая часть _|WARNING:...`,
    };

  const key = hash(cookie);
  const hit = sessions.get(key);
  if (hit && Date.now() - hit.t < SESSION_TTL) return { ok: true, user: hit.user };

  try {
    const j = await call(cookie, "users", "/v1/users/authenticated");
    if (!j?.id) {
      sessions.delete(key);
      return { ok: false, reason: "Roblox не распознал сессию" };
    }
    const user: AuthedIdentity = {
      id: Number(j.id),
      name: String(j.name ?? ""),
      displayName: String(j.displayName ?? j.name ?? ""),
    };
    sessions.set(key, { t: Date.now(), user });
    return { ok: true, user };
  } catch (e) {
    sessions.delete(key);
    const status = (e as { status?: number; detail?: string })?.status;
    const detail = (e as { detail?: string })?.detail;
    const suffix = detail ? ` (код ${detail})` : "";
    if (status === 401)
      return {
        ok: false,
        reason: `Roblox отверг сессию (401${suffix}): cookie недействительна, устарела или привязана к вашему устройству/региону — сервер лаунчера находится в другой сети. Обновите roblox.com, возьмите свежую cookie и попробуйте снова`,
      };
    if (status === 403)
      return {
        ok: false,
        reason: `Roblox отверг сессию (403${suffix}): вход с IP сервера заблокирован. Выйдите и снова войдите на roblox.com, затем повторите`,
      };
    return { ok: false, reason: "Roblox временно недоступен — повторите через минуту" };
  }
}

export async function getAuthedUser(cookie: string): Promise<AuthedIdentity | null> {
  const r = await validateCookie(cookie);
  return r.ok ? r.user : null;
}

/* personal data fetch with a tiny per-cookie cache */
export async function authedFetch(
  cookie: string,
  sub: string,
  path: string,
  opts: { method?: "GET" | "POST"; body?: any; ttl?: number } = {}
): Promise<any> {
  const { method = "GET", body, ttl = DATA_TTL } = opts;
  const key = `${hash(cookie)}:${method}:${sub}:${path}`;
  const hit = dataCache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.data;
  const data = await call(cookie, sub, path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  dataCache.set(key, { t: Date.now(), data });
  return data;
}
