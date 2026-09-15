/* Server-side Roblox Web API client.
 * Talks to public Roblox endpoints with a transparent fallback to the
 * RoProxy mirror, adds a small in-memory TTL cache and deduplicates
 * in-flight requests. Powers every route under /api/roblox/*.
 */
import type {
  ChartsPayload,
  GameBadge,
  GameDetail,
  GamePass,
  GameServer,
  GameSummary,
  HomePayload,
  ProfilePayload,
  Rail,
  SearchPayload,
  CatalogPayload,
  CatalogItem,
  VersionsPayload,
} from "./shared";
import { pct } from "./shared";

type Raw = Record<string, any>;

const TTL = 45_000;
const cache = new Map<string, { t: number; data: any }>();
const inflight = new Map<string, Promise<any>>();

export class UpstreamError extends Error {
  status = 502;
  constructor(msg: string) {
    super(msg);
    this.name = "UpstreamError";
  }
}

export async function robloxFetch(
  path: string,
  opts: { sub?: string; method?: "GET" | "POST"; body?: any; ttl?: number } = {}
): Promise<any> {
  const { sub = "games", method = "GET", body, ttl = TTL } = opts;
  const key = `${method}:${sub}:${path}:${body ? JSON.stringify(body) : ""}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.data;
  const pending = inflight.get(key);
  if (pending) return pending;

  const hosts = [`https://${sub}.roblox.com`, `https://${sub}.roproxy.com`];
  const job = (async () => {
    let lastErr: any = null;
    for (const base of hosts) {
      try {
        const res = await fetch(base + path, {
          method,
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "User-Agent": "RoLaunch/1.0 (+launcher)",
          },
          body: body === undefined ? undefined : JSON.stringify(body),
          signal: AbortSignal.timeout(9000),
          next: { revalidate: 60 },
        });
        if (!res.ok) {
          lastErr = new UpstreamError(`${sub} ${res.status} for ${path}`);
          continue;
        }
        const data = await res.json();
        cache.set(key, { t: Date.now(), data });
        return data;
      } catch (e) {
        lastErr = e;
      }
    }
    throw lastErr instanceof Error
      ? lastErr
      : new UpstreamError(`Roblox недоступен: ${path}`);
  })();

  inflight.set(key, job);
  try {
    return await job;
  } finally {
    inflight.delete(key);
  }
}

/* ---------- helpers ---------- */

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const qs = (name: string, ids: number[]) => ids.map((i) => `${name}=${i}`).join("&");

const uniq = (arr: number[]) => Array.from(new Set(arr.filter((n) => Number.isFinite(n) && n > 0)));

/* Place → universe resolution (modern per-place endpoint, public) */
export async function resolvePlaces(placeIds: number[]): Promise<number[]> {
  const ids = uniq(placeIds).slice(0, 80);
  if (!ids.length) return [];
  const resolved = await Promise.all(
    ids.map(async (p) => {
      try {
        const j = await robloxFetch(`/universes/v1/places/${p}/universe`, { sub: "apis" });
        return Number(j?.universeId) || 0;
      } catch {
        return 0;
      }
    })
  );
  return uniq(resolved);
}

/* Normalized multiget details: details + votes + icons */
export async function getGameDetails(universeIds: number[]): Promise<GameSummary[]> {
  const ids = uniq(universeIds);
  if (!ids.length) return [];
  const chunks = chunk(ids, 48).slice(0, 4);
  const details: Raw[] = [];
  const votes = new Map<number, { up: number; down: number }>();
  const icons = new Map<number, string>();

  await Promise.all(
    chunks.map(async (c) => {
      const tryE = async (fn: () => Promise<void>) => {
        try {
          await fn();
        } catch {
          /* ignore partial failures */
        }
      };
      await Promise.all([
        tryE(async () => {
          const j = await robloxFetch(`/v1/games?${qs("universeIds", c)}`);
          if (Array.isArray(j?.data)) details.push(...j.data);
        }),
        tryE(async () => {
          const j = await robloxFetch(`/v1/games/votes?${qs("universeIds", c)}`);
          for (const v of j?.data ?? []) {
            votes.set(Number(v?.id), { up: Number(v?.upVotes) || 0, down: Number(v?.downVotes) || 0 });
          }
        }),
      ]);
      await tryE(async () => {
        const j = await robloxFetch(
          `/v1/games/icons?${qs("universeIds", c)}&size=512x512&format=Png&isCircular=false`,
          { sub: "thumbnails" }
        );
        for (const t of j?.data ?? []) {
          if (t?.state === "Completed" && t?.imageUrl) icons.set(Number(t.targetId), t.imageUrl);
        }
      });
    })
  );

  const order = new Map(ids.map((id, i) => [id, i]));
  const games = details
    .map((d): GameSummary => {
      const id = Number(d?.id);
      const v = votes.get(id) ?? { up: 0, down: 0 };
      return {
        universeId: id,
        placeId: Number(d?.rootPlaceId) || id,
        name: String(d?.name ?? "Без названия"),
        creatorName: String(d?.creator?.name ?? "Roblox"),
        creatorId: Number(d?.creator?.id) || 0,
        creatorType: d?.creator?.type,
        creatorVerified: Boolean(d?.creator?.hasVerifiedBadge),
        playing: Number(d?.playing) || 0,
        visits: Number(d?.visits) || 0,
        favorites: Number(d?.favoritedCount) || 0,
        maxPlayers: Number(d?.maxPlayers) || 0,
        upVotes: v.up,
        downVotes: v.down,
        rating: pct(v.up, v.down),
        iconUrl: icons.get(id) ?? null,
        genre: d?.genre && d.genre !== "All" ? String(d.genre) : undefined,
        created: d?.created,
        updated: d?.updated,
        price: typeof d?.price === "number" ? d.price : null,
      };
    })
    .filter((g) => g.universeId)
    .sort((a, b) => (order.get(a.universeId) ?? 999) - (order.get(b.universeId) ?? 999));
  return games;
}

/* ---------- curated collections (placeIds — resolved live) ---------- */

export const CURATED: Record<string, number[]> = {
  hero: [
    126884695634066, // Grow a Garden
    16732694052, // Fisch
    2753915549, // Blox Fruits
    10449761463, // The Strongest Battlegrounds
    4924922222, // Brookhaven RP
    13772394625, // Blade Ball
    920587237, // Adopt Me!
    6516141723, // DOORS
  ],
  popular: [
    2753915549, 4924922222, 920587237, 13772394625, 10449761463, 16732694052,
    8737899170, 6516141723, 1962086868, 9872472334, 606849621, 1537690962,
    6403373529, 15532962292, 18668065416, 4616652839, 142823291, 286090429,
  ],
  fighting: [
    10449761463, 13772394625, 292439477, 286090429, 142823291, 6403373529,
    9872472334, 4616652839, 15532962292, 1962086868, 83178330346569, 17570663588,
  ],
  roleplay: [
    4924922222, 920587237, 185655149, 735030788, 7047488135, 8737899170,
    6516141723, 1962086868,
  ],
  classic: [
    189707, 192800, 606849621, 292439477, 286090429, 142823291, 1537690962,
    1962086868, 4623386862, 185655149,
  ],
  horror: [
    6516141723, 4623386862, 9872472334, 189707, 704193954, 6839171747,
  ],
};

const PLACE_FIX: Record<string, number[]> = {
  horror: [6516141723, 4623386862, 9872472334, 189707, 704193954],
};

export async function universesOf(key: keyof typeof CURATED | string): Promise<number[]> {
  const list = CURATED[key] ?? PLACE_FIX[key] ?? [];
  return resolvePlaces(list);
}

/* ---------- home ---------- */

async function addHeroMedia(games: GameSummary[]): Promise<GameSummary[]> {
  try {
    const ids = games.map((g) => g.universeId);
    const j = await robloxFetch(
      `/v1/games/multiget/thumbnails?${qs("universeIds", ids)}&countPerUniverse=2&defaults=true&size=768x432&format=Png&isCircular=false`,
      { sub: "thumbnails" }
    );
    const media = new Map<number, string>();
    for (const e of j?.data ?? []) {
      const t = Array.isArray(e?.thumbnails) ? e.thumbnails[0] : null;
      if (t?.state === "Completed" && t?.imageUrl) media.set(Number(e?.universeId), t.imageUrl);
    }
    return games.map((g) => ({ ...g, mediaUrl: media.get(g.universeId) ?? null }));
  } catch {
    return games;
  }
}

async function exploreRails(limit = 3): Promise<Rail[]> {
  try {
    const j = await robloxFetch(`/explore-api/v1/get-sorts?sessionId=${crypto.randomUUID()}`, {
      sub: "apis",
      ttl: 60_000,
    });
    const sorts: Raw[] = Array.isArray(j?.sorts) ? j.sorts : [];
    const gameSorts = sorts
      .filter((s) => Array.isArray(s?.entries) && s.entries.length >= 6)
      .slice(0, limit);

    const rails: Rail[] = [];
    for (const s of gameSorts) {
      const uni: number[] = [];
      const places: number[] = [];
      for (const e of s.entries.slice(0, 24)) {
        const u = Number(e?.universeId);
        const p = Number(e?.placeId ?? e?.rootPlaceId);
        if (u) uni.push(u);
        else if (p) places.push(p);
      }
      const resolved = places.length ? await resolvePlaces(places) : [];
      const ids = uniq([...uni, ...resolved]).slice(0, 18);
      const items = await getGameDetails(ids);
      if (!items.length) continue;
      const title =
        s?.topicLayoutData?.displayName || s?.sortDisplayName || s?.sortId || "Сейчас играют";
      rails.push({ key: String(s?.sortId ?? s?.id ?? rails.length), title, items });
    }
    return rails;
  } catch {
    return [];
  }
}

export async function getHome(): Promise<HomePayload> {
  const [heroUniverses, popularUniverses] = await Promise.all([
    universesOf("hero"),
    universesOf("popular"),
  ]);

  const [hero, liveRails] = await Promise.all([
    getGameDetails(heroUniverses).then(addHeroMedia),
    exploreRails(3),
  ]);

  const rails: Rail[] = [...liveRails];

  if (!rails.length) {
    const popular = await getGameDetails(popularUniverses);
    rails.push({
      key: "popular",
      title: "Сейчас популярно",
      items: [...popular].sort((a, b) => b.playing - a.playing),
    });
  }

  const curatedDefs: { key: string; title: string }[] = [
    { key: "fighting", title: "Битвы и экшен" },
    { key: "roleplay", title: "Ролевые миры" },
    { key: "classic", title: "Бессмертная классика" },
  ];
  for (const def of curatedDefs) {
    if (rails.length >= 5) break;
    try {
      const ids = await universesOf(def.key);
      const items = await getGameDetails(ids);
      if (items.length >= 4) rails.push({ ...def, items });
    } catch {
      /* skip */
    }
  }

  const playingNow = [...rails.flatMap((r) => r.items), ...hero].reduce(
    (acc, g) => acc + g.playing,
    0
  );
  return {
    hero,
    rails: rails.slice(0, 5),
    live: liveRails.length > 0,
    stats: {
      games: new Set([...rails.flatMap((r) => r.items.map((i) => i.universeId)), ...hero.map((h) => h.universeId)]).size,
      playingNow,
    },
  };
}

/* ---------- charts ---------- */

export async function getCharts(): Promise<ChartsPayload> {
  const topIds = await universesOf("popular");
  const topGames = await getGameDetails(topIds);
  const top = [...topGames].sort((a, b) => b.playing - a.playing);
  const rated = [...topGames]
    .filter((g) => g.rating != null && g.upVotes + g.downVotes > 2000)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  const classicIds = await universesOf("classic");
  const classics = await getGameDetails(classicIds);
  const day = Math.floor(Date.now() / 86_400_000);
  const trending = [...topGames, ...classics]
    .filter((g, i, arr) => arr.findIndex((x) => x.universeId === g.universeId) === i)
    .sort((a, b) => ((a.universeId + day) % 97) - ((b.universeId + day) % 97))
    .slice(0, 12);
  return { top, rated, trending };
}

/* ---------- single game aggregate ---------- */

export async function getGameDetail(idOrPlace: number): Promise<GameDetail> {
  let [game] = await getGameDetails([idOrPlace]);
  if (!game) {
    const u = await resolvePlaces([idOrPlace]);
    if (u.length) [game] = await getGameDetails([u[0]]);
  }
  if (!game) throw new UpstreamError("Плейс не найден");

  const universeId = game.universeId;
  const detail = (async () => {
    try {
      const j = await robloxFetch(`/v1/games?universeIds=${universeId}`);
      return Array.isArray(j?.data) ? j.data[0] : null;
    } catch {
      return null;
    }
  })();
  const mediaP = (async (): Promise<string[]> => {
    try {
      const j = await robloxFetch(
        `/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=6&defaults=true&size=768x432&format=Png&isCircular=false`,
        { sub: "thumbnails" }
      );
      const entry = (j?.data ?? [])[0];
      return (entry?.thumbnails ?? [])
        .filter((t: Raw) => t?.state === "Completed" && t?.imageUrl)
        .map((t: Raw) => t.imageUrl as string);
    } catch {
      return [];
    }
  })();
  const badgesP = (async (): Promise<GameBadge[]> => {
    try {
      const j = await robloxFetch(
        `/v1/universes/${universeId}/badges?limit=12&sortOrder=Desc`,
        { sub: "badges" }
      );
      return (j?.data ?? []).map(
        (b: Raw): GameBadge => ({
          id: Number(b?.id),
          name: String(b?.name ?? "Бейдж"),
          description: String(b?.description ?? ""),
          awarded: b?.statistics?.awardedCount,
          winRate: b?.statistics?.winRatePercentage,
        })
      );
    } catch {
      return [];
    }
  })();
  const passesP = (async (): Promise<GamePass[]> => {
    try {
      const j = await robloxFetch(
        `/v1/games/${universeId}/game-passes?limit=30&sortOrder=Asc&pageView=fullPage`
      );
      const raw: Raw[] = j?.data?.gamePassProductInformation
        ? j.data.gamePassProductInformation
        : j?.data ?? [];
      const passes = raw
        .map((p: Raw): { id: number; name: string; price: number | null } => ({
          id: Number(p?.id ?? p?.gamePassId ?? p?.targetId),
          name: String(p?.name ?? "Пропуск"),
          price: typeof p?.price === "number" ? p.price : p?.price?.robux ?? null,
        }))
        .filter((p) => p.id && p.name);
      const ids = passes.map((p) => p.id);
      const icons = new Map<number, string>();
      if (ids.length) {
        try {
          const t = await robloxFetch(
            `/v1/game-passes?${qs("gamePassIds", ids)}&size=150x150&format=Png&isCircular=false`,
            { sub: "thumbnails" }
          );
          for (const e of t?.data ?? []) {
            if (e?.state === "Completed" && e?.imageUrl) icons.set(Number(e.targetId), e.imageUrl);
          }
        } catch {
          /* icons optional */
        }
      }
      return passes.map((p) => ({ ...p, iconUrl: icons.get(p.id) ?? null }));
    } catch {
      return [];
    }
  })();
  const serversP = (async (): Promise<GameServer[]> => {
    try {
      const j = await robloxFetch(
        `/v1/games/${game.placeId}/servers/Public?sortOrder=Desc&excludeFullGames=false&limit=14`
      );
      return (j?.data ?? [])
        .filter((s: Raw) => s?.id)
        .map(
          (s: Raw): GameServer => ({
            id: String(s.id),
            playing: Number(s?.playing) || 0,
            maxPlayers: Number(s?.maxPlayers) || 0,
            fps: Math.round(Number(s?.fps) || 0),
            ping: Math.round(Number(s?.ping) || 0),
          })
        );
    } catch {
      return [];
    }
  })();
  const similarP = (async (): Promise<GameSummary[]> => {
    try {
      const j = await robloxFetch(`/v1/games/recommendations/game/${universeId}?max=10`);
      const ids = (j?.games ?? [])
        .map((g: Raw) => Number(g?.universeId))
        .filter((n: number) => Number.isFinite(n));
      if (!ids.length) return [];
      return (await getGameDetails(ids)).filter((g) => g.universeId !== universeId).slice(0, 8);
    } catch {
      return [];
    }
  })();

  const [full, media, badges, passes, servers, similar] = await Promise.all([
    detail,
    mediaP,
    badgesP,
    passesP,
    serversP,
    similarP,
  ]);

  return {
    ...game,
    description: String(full?.description ?? full?.sourceDescription ?? "Описание появится позже."),
    media,
    badges,
    passes,
    servers,
    similar,
  };
}

/* ---------- profile ---------- */

export async function getUserProfile(nameOrId: string): Promise<ProfilePayload> {
  let userId = /^\d+$/.test(nameOrId) ? Number(nameOrId) : 0;
  if (!userId) {
    const j = await robloxFetch(`/v1/usernames/users`, {
      sub: "users",
      method: "POST",
      body: { usernames: [nameOrId], excludeBannedUsers: false },
    });
    userId = Number(j?.data?.[0]?.id) || 0;
  }
  if (!userId) throw new UpstreamError("Игрок не найден");

  const userP = robloxFetch(`/v1/users/${userId}`, { sub: "users" }).catch(() => null);
  const premiumP = robloxFetch(`/v1/users/${userId}/validate-membership`, {
    sub: "premiumfeatures",
  })
    .then((v) => v === true || v?.value === true)
    .catch(() => false);
  const countsP = (async () => {
    const grab = async (p: string) => {
      try {
        const j = await robloxFetch(p, { sub: "friends" });
        return Number(j?.count) || 0;
      } catch {
        return 0;
      }
    };
    const [friends, followers, followings] = await Promise.all([
      grab(`/v1/users/${userId}/friends/count`),
      grab(`/v1/users/${userId}/followers/count`),
      grab(`/v1/users/${userId}/followings/count`),
    ]);
    return { friends, followers, followings };
  })();
  const avatarP = (async () => {
    try {
      const j = await robloxFetch(
        `/v1/users/avatar-headshot?userIds=${userId}&size=420x420&format=Png&isCircular=true`,
        { sub: "thumbnails" }
      );
      return j?.data?.[0]?.imageUrl ?? null;
    } catch {
      return null;
    }
  })();
  const avatarFullP = (async () => {
    try {
      const j = await robloxFetch(
        `/v1/users/avatar?userIds=${userId}&size=720x720&format=Png&isCircular=false`,
        { sub: "thumbnails" }
      );
      return j?.data?.[0]?.imageUrl ?? null;
    } catch {
      return null;
    }
  })();
  const gamesP = (async (): Promise<GameSummary[]> => {
    try {
      const j = await robloxFetch(
        `/v2/users/${userId}/games?accessFilter=Public&limit=12&sortOrder=Desc&sortCategory=LastUpdated`
      );
      const ids = (j?.data ?? []).map((g: Raw) => Number(g?.id)).filter((n: number) => n);
      if (!ids.length) return [];
      return await getGameDetails(ids);
    } catch {
      return [];
    }
  })();

  const [user, premium, counts, avatar, avatarFull, games] = await Promise.all([
    userP,
    premiumP,
    countsP,
    avatarP,
    avatarFullP,
    gamesP,
  ]);
  if (!user?.id) throw new UpstreamError("Игрок не найден");

  return {
    user: {
      id: Number(user.id),
      name: String(user.name ?? nameOrId),
      displayName: String(user.displayName ?? user.name ?? nameOrId),
      description: String(user.description ?? ""),
      created: user.created ?? "",
      isBanned: Boolean(user.isBanned),
      verified: Boolean(user.hasVerifiedBadge),
    },
    premium: Boolean(premium),
    counts,
    avatar,
    avatarFull,
    games,
  };
}

/* ---------- search ---------- */

export async function getSearch(q: string): Promise<SearchPayload> {
  const query = q.trim().slice(0, 64);
  if (!query) return { games: [], users: [] };

  const gamesP = (async (): Promise<GameSummary[]> => {
    try {
      const j = await robloxFetch(
        `/search-api/omni-search?searchQuery=${encodeURIComponent(query)}&pageToken=&sessionId=${crypto.randomUUID()}`,
        { sub: "apis", ttl: 20_000 }
      );
      const groups: Raw[] = Array.isArray(j?.searchResults) ? j.searchResults : [];
      const gameGroup = groups.find((g) => g?.contentGroupType === "Game");
      let ids: number[] = (gameGroup?.contents ?? [])
        .map((c: Raw) => Number(c?.universeId))
        .filter((n: number) => n);
      if (!ids.length) {
        const legacy = await robloxFetch(
          `/v2/games/list?keyword=${encodeURIComponent(query)}&maxRows=20`,
          { sub: "games" }
        ).catch(() => null);
        ids = (legacy?.games ?? []).map((g: Raw) => Number(g?.universeId)).filter(Boolean);
      }
      if (!ids.length) return [];
      return await getGameDetails(ids.slice(0, 12));
    } catch {
      return [];
    }
  })();

  const usersP = (async () => {
    try {
      const j = await robloxFetch(
        `/v1/users/search?keyword=${encodeURIComponent(query)}&limit=8`,
        { sub: "users" }
      );
      const raw: Raw[] = j?.data ?? [];
      let avatars = new Map<number, string>();
      const ids = raw.map((u) => Number(u?.id)).filter((n) => n);
      if (ids.length) {
        try {
          const t = await robloxFetch(
            `/v1/users/avatar-headshot?${qs("userIds", ids)}&size=150x150&format=Png&isCircular=true`,
            { sub: "thumbnails" }
          );
          avatars = new Map(
            (t?.data ?? []).map((e: Raw) => [Number(e?.targetId), String(e?.imageUrl ?? "")])
          );
        } catch {
          /* optional */
        }
      }
      return raw.map((u) => ({
        id: Number(u?.id),
        name: String(u?.name ?? ""),
        displayName: String(u?.displayName ?? u?.name ?? ""),
        description: String(u?.description ?? ""),
        avatar: avatars.get(Number(u?.id)) || null,
      }));
    } catch {
      return [];
    }
  })();

  const [games, users] = await Promise.all([gamesP, usersP]);
  return { games, users };
}

/* ---------- catalog ---------- */

export async function getCatalog(params: URLSearchParams): Promise<CatalogPayload> {
  const category = params.get("category") || "CommunityCreations";
  // catalog API only accepts these page sizes — snap to the nearest one
  const allowed = [10, 28, 30, 60, 120];
  const want = Number(params.get("limit")) || 30;
  const limit = allowed.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
  const cursor = params.get("cursor") || "";
  const keyword = params.get("keyword") || "";
  const sortType = params.get("sortType") || "2";

  const path =
    `/v2/search/items/details?categoryFilter=${encodeURIComponent(category)}` +
    `&limit=${limit}&sortType=${sortType}` +
    (cursor ? `&cursor=${encodeURIComponent(cursor)}` : "") +
    (keyword ? `&keyword=${encodeURIComponent(keyword)}` : "");

  const j = await robloxFetch(path, { sub: "catalog" });
  const raw: Raw[] = Array.isArray(j?.data) ? j.data : j?.data?.data ?? [];
  const nextCursor = j?.nextPageCursor ?? j?.data?.nextPageCursor ?? null;

  const assetIds: number[] = [];
  const bundleIds: number[] = [];
  for (const it of raw) {
    const id = Number(it?.id);
    if (!id) continue;
    if (it?.itemType === "Bundle" || it?.bundleType) bundleIds.push(id);
    else assetIds.push(id);
  }

  const thumbs = new Map<string, string>();
  try {
    if (assetIds.length)
      await Promise.all(
        chunk(assetIds, 50).map(async (c) => {
          const t = await robloxFetch(
            `/v1/assets?${qs("assetIds", c)}&size=420x420&format=Png&isCircular=false`,
            { sub: "thumbnails" }
          );
          for (const e of t?.data ?? [])
            if (e?.state === "Completed" && e?.imageUrl)
              thumbs.set(`A${Number(e.targetId)}`, e.imageUrl);
        })
      );
    if (bundleIds.length) {
      const t = await robloxFetch(
        `/v1/bundles/icons?${qs("bundleIds", bundleIds)}&size=420x420&format=Png&isCircular=false`,
        { sub: "thumbnails" }
      );
      for (const e of t?.data ?? [])
        if (e?.state === "Completed" && e?.imageUrl) thumbs.set(`B${Number(e.targetId)}`, e.imageUrl);
    }
  } catch {
    /* thumbs optional */
  }

  const items: CatalogItem[] = raw
    .map((it): CatalogItem => {
      const id = Number(it?.id);
      const isBundle = it?.itemType === "Bundle" || Boolean(it?.bundleType);
      const restrictions: string[] = Array.isArray(it?.itemRestrictions) ? it.itemRestrictions : [];
      const collectible = Boolean(it?.isCollectible ?? restrictions.join(" ").includes("Limited"));
      return {
        id,
        name: String(it?.name ?? "Предмет"),
        type: isBundle ? "Bundle" : "Asset",
        price: typeof it?.price === "number" ? it.price : it?.priceInRobux ?? null,
        priceStatus: String(it?.priceStatus ?? ""),
        limited: restrictions.includes("Limited") || restrictions.includes("LimitedUnique"),
        collectible,
        premium: Boolean(it?.premiumPricing ?? it?.hasPremiumBenefit),
        favorites: Number(it?.favoriteCount) || 0,
        thumb: thumbs.get(`${isBundle ? "B" : "A"}${id}`) ?? null,
        parts: Array.isArray(it?.bundledItems) ? it.bundledItems.length : undefined,
      };
    })
    .filter((i) => i.id);

  return { items, nextCursor: nextCursor ? String(nextCursor) : null };
}

/* ---------- versions ---------- */

export async function getVersions(): Promise<VersionsPayload> {
  const grab = async (bin: string) => {
    try {
      const j = await robloxFetch(`/v2/client-version/${bin}`, {
        sub: "clientsettingscdn",
        ttl: 300_000,
      });
      return { version: String(j?.version ?? "—"), guid: String(j?.clientVersionUpload ?? "—") };
    } catch {
      return { version: "—", guid: "—" };
    }
  };
  const [player, studio] = await Promise.all([grab("WindowsPlayer"), grab("WindowsStudio64")]);
  return { player, studio, fetchedAt: new Date().toISOString() };
}
