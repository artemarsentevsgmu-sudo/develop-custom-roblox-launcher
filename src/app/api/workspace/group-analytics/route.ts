import { NextResponse, type NextRequest } from "next/server";
import { getGameDetails, robloxFetch } from "@/lib/roblox";
import { authedFetch, sanitizeCookie, validateCookie } from "@/lib/auth";
import type { GameSummary } from "@/lib/shared";

export const dynamic = "force-dynamic";

const MANAGE_RANK = 254;
type Raw = Record<string, any>;

export interface GroupAnalytics {
  group: { id: number; name: string; icon: string | null; memberCount: number };
  access: { userId: number; username: string; roleName: string; rank: number };
  games: GameSummary[];
  totals: { playing: number; visits: number; favorites: number; upVotes: number; downVotes: number; games: number };
  rating: number | null;
  topByPlaying: GameSummary[];
  topByVisits: GameSummary[];
  roles: { id: number; name: string; rank: number; memberCount: number }[];
  revenue: {
    available: boolean;
    reason?: string;
    funds?: number;
    summary?: { timeFrame: string; recurringRobuxStipend: number; itemSaleRobux: number; purchasedRobux: number; tradeSystemRobux: number; groupPayoutRobux: number; total: number };
  };
}

async function resolveUserId(nameOrId: string): Promise<number> {
  if (/^\d+$/.test(nameOrId)) return Number(nameOrId);
  const j = await robloxFetch(`/v1/usernames/users`, {
    sub: "users",
    method: "POST",
    body: { usernames: [nameOrId], excludeBannedUsers: false },
  });
  return Number(j?.data?.[0]?.id) || 0;
}

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const groupId = Number(p.get("groupId"));
    const who = (p.get("user") || "").trim();
    if (!groupId) return NextResponse.json({ error: "Не указана группа" }, { status: 400 });
    if (!who) return NextResponse.json({ error: "Не указан игрок" }, { status: 400 });

    const userId = await resolveUserId(who.slice(0, 60));
    if (!userId) return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });

    /* --- access check: role rank must be >= 254 --- */
    const rolesJson = await robloxFetch(`/v2/users/${userId}/groups/roles`, { sub: "groups" });
    const entry: Raw | undefined = (rolesJson?.data ?? []).find(
      (g: Raw) => Number(g?.group?.id) === groupId
    );
    if (!entry) {
      return NextResponse.json(
        { error: `Игрок @${who} не состоит в этой группе` },
        { status: 403 }
      );
    }
    const rank = Number(entry?.role?.rank) || 0;
    if (rank < MANAGE_RANK) {
      return NextResponse.json(
        {
          error: `Недостаточно прав: роль «${entry?.role?.name}» имеет ранг ${rank}, нужен ${MANAGE_RANK}+`,
          rank,
          roleName: String(entry?.role?.name ?? ""),
        },
        { status: 403 }
      );
    }

    /* --- real public group data --- */
    const [info, iconJson, gamesJson, groupRoles] = await Promise.all([
      robloxFetch(`/v1/groups/${groupId}`, { sub: "groups" }).catch(() => null),
      robloxFetch(`/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png&isCircular=false`, {
        sub: "thumbnails",
      }).catch(() => null),
      robloxFetch(`/v2/groups/${groupId}/games?accessFilter=Public&limit=50&sortOrder=Desc`, {
        sub: "games",
      }).catch(() => null),
      robloxFetch(`/v1/groups/${groupId}/roles`, { sub: "groups" }).catch(() => null),
    ]);

    const universeIds = (gamesJson?.data ?? [])
      .map((g: Raw) => Number(g?.id))
      .filter((n: number) => Number.isFinite(n) && n > 0)
      .slice(0, 40);
    const games = universeIds.length ? await getGameDetails(universeIds).catch(() => []) : [];

    const totals = games.reduce(
      (a, g) => ({
        playing: a.playing + g.playing,
        visits: a.visits + g.visits,
        favorites: a.favorites + g.favorites,
        upVotes: a.upVotes + g.upVotes,
        downVotes: a.downVotes + g.downVotes,
        games: a.games + 1,
      }),
      { playing: 0, visits: 0, favorites: 0, upVotes: 0, downVotes: 0, games: 0 }
    );
    const voteTotal = totals.upVotes + totals.downVotes;

    /* --- revenue: only with an authenticated session that has permission --- */
    const cookie = sanitizeCookie(req.headers.get("x-rbx-cookie") || "");
    let revenue: GroupAnalytics["revenue"] = {
      available: false,
      reason:
        "Доход группы Roblox отдаёт только авторизованной сессии с правом «Просмотр финансов». Войдите в аккаунт в настройках лаунчера.",
    };
    if (cookie) {
      const check = await validateCookie(cookie);
      if (!check.ok) {
        revenue = { available: false, reason: check.reason };
      } else {
        try {
          const [funds, summary] = await Promise.all([
            authedFetch(cookie, "economy", `/v1/groups/${groupId}/currency`).catch(() => null),
            authedFetch(cookie, "economy", `/v1/groups/${groupId}/revenue/summary/month`).catch(
              () => null
            ),
          ]);
          if (funds || summary) {
            revenue = {
              available: true,
              funds: typeof funds?.robux === "number" ? funds.robux : undefined,
              summary: summary
                ? {
                    timeFrame: "month",
                    recurringRobuxStipend: Number(summary.recurringRobuxStipend) || 0,
                    itemSaleRobux: Number(summary.itemSaleRobux) || 0,
                    purchasedRobux: Number(summary.purchasedRobux) || 0,
                    tradeSystemRobux: Number(summary.tradeSystemRobux) || 0,
                    groupPayoutRobux: Number(summary.groupPayoutRobux) || 0,
                    total:
                      (Number(summary.recurringRobuxStipend) || 0) +
                      (Number(summary.itemSaleRobux) || 0) +
                      (Number(summary.purchasedRobux) || 0) +
                      (Number(summary.tradeSystemRobux) || 0) +
                      (Number(summary.groupPayoutRobux) || 0),
                  }
                : undefined,
            };
          } else {
            revenue = {
              available: false,
              reason: "Roblox отклонил запрос финансов: у аккаунта нет права «Просмотр финансов» в этой группе.",
            };
          }
        } catch (e) {
          revenue = {
            available: false,
            reason: e instanceof Error ? e.message : "Финансы недоступны",
          };
        }
      }
    }

    const payload: GroupAnalytics = {
      group: {
        id: groupId,
        name: String(info?.name ?? entry?.group?.name ?? "Группа"),
        icon: iconJson?.data?.[0]?.imageUrl ?? null,
        memberCount: Number(info?.memberCount ?? entry?.group?.memberCount) || 0,
      },
      access: {
        userId,
        username: who,
        roleName: String(entry?.role?.name ?? ""),
        rank,
      },
      games,
      totals,
      rating: voteTotal ? Math.round((totals.upVotes / voteTotal) * 100) : null,
      topByPlaying: [...games].sort((a, b) => b.playing - a.playing).slice(0, 10),
      topByVisits: [...games].sort((a, b) => b.visits - a.visits).slice(0, 10),
      roles: (groupRoles?.roles ?? [])
        .map((r: Raw) => ({
          id: Number(r?.id),
          name: String(r?.name ?? ""),
          rank: Number(r?.rank) || 0,
          memberCount: Number(r?.memberCount) || 0,
        }))
        .sort((a: { rank: number }, b: { rank: number }) => b.rank - a.rank),
      revenue,
    };

    return NextResponse.json(payload);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Roblox недоступен" },
      { status: 502 }
    );
  }
}
