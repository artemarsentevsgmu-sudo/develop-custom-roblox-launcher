import { NextResponse, type NextRequest } from "next/server";
import { authedFetch, sanitizeCookie, validateCookie } from "@/lib/auth";
import { getGameDetails } from "@/lib/roblox";
import type { MePayload } from "@/lib/shared";

export const dynamic = "force-dynamic";

const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Referer: "",
};

/* Roblox exposes no public "recently played" API, and the discovery
 * recommendations feed is NOT play history — showing it as "continue playing"
 * was misleading, so it is gone. The home page now uses the launcher's own
 * real launch history instead. */

async function handle(req: NextRequest, rawCookie: string) {
  const cookie = sanitizeCookie(rawCookie);
  if (!cookie) {
    return NextResponse.json({ error: "Не авторизовано" }, { status: 401, headers: NO_STORE });
  }
  const check = await validateCookie(cookie);
  if (!check.ok) {
    return NextResponse.json({ error: check.reason }, { status: 401, headers: NO_STORE });
  }
  const user = check.user;

  const [avatar, robux, premium, friends, requests, messages, notifications] =
    await Promise.all([
      authedFetch(cookie, "thumbnails", `/v1/users/avatar-headshot?userIds=${user.id}&size=150x150&format=Png&isCircular=true`)
        .then((j) => j?.data?.[0]?.imageUrl ?? null)
        .catch(() => null),
      authedFetch(cookie, "economy", `/v1/users/${user.id}/currency`)
        .then((j) => (typeof j?.robux === "number" ? j.robux : null))
        .catch(() => null),
      authedFetch(cookie, "premiumfeatures", `/v1/users/${user.id}/validate-membership`)
        .then((v) => v === true)
        .catch(() => false),
      authedFetch(cookie, "friends", `/v1/users/${user.id}/friends/count`)
        .then((j) => Number(j?.count) || 0)
        .catch(() => 0),
      authedFetch(cookie, "friends", `/v1/my/friends/requests?limit=10`)
        .then((j) => (Array.isArray(j?.data) ? j.data.length : 0))
        .catch(() => 0),
      authedFetch(cookie, "privatemessages", `/v1/messages/unread/count`)
        .then((j) => Number(j?.count) || 0)
        .catch(() => 0),
      authedFetch(cookie, "notifications", `/v2/stream-notifications/unread-count`)
        .then((j) => Number(j?.unreadNotifications) || 0)
        .catch(() => 0),
    ]);

  const payload: MePayload = {
    user: { id: user.id, name: user.name, displayName: user.displayName, verified: false },
    avatar,
    robux,
    premium,
    counts: { friends, requests, messages, notifications },
    continuePlaying: [],
  };
  return NextResponse.json(payload, { headers: NO_STORE });
}

export async function GET(req: NextRequest) {
  return handle(req, req.headers.get("x-rbx-cookie") || "");
}

/* Cookie travels in the JSON body here — some reverse proxies strip
 * unknown custom headers, and the body path is always reliable. */
export async function POST(req: NextRequest) {
  let raw = "";
  try {
    const body = await req.json();
    raw = String(body?.cookie ?? "");
  } catch {
    raw = "";
  }
  return handle(req, raw);
}
