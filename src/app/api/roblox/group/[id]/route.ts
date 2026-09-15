import { NextResponse } from "next/server";
import { getGameDetails, robloxFetch } from "@/lib/roblox";
import type { GameSummary } from "@/lib/shared";

export const dynamic = "force-dynamic";

type Raw = Record<string, any>;

export interface GroupPayload {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  owner: { userId: number; username: string; displayName: string; avatar: string | null } | null;
  shout: { body: string; poster: string; created: string } | null;
  icon: string | null;
  verified: boolean;
  publicEntry: boolean;
  locked: boolean;
  roles: { id: number; name: string; rank: number; memberCount: number; share: number }[];
  games: GameSummary[];
  socials: { type: string; url: string; title: string }[];
  stats: { playing: number; visits: number; games: number; topRole: string };
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const groupId = Number(id);
    if (!Number.isFinite(groupId) || groupId <= 0) {
      return NextResponse.json({ error: "Некорректный ID группы" }, { status: 400 });
    }

    const info: Raw = await robloxFetch(`/v1/groups/${groupId}`, { sub: "groups" }).catch(() => null);
    if (!info?.id) return NextResponse.json({ error: "Группа не найдена" }, { status: 404 });

    const [rolesJson, iconJson, gamesJson, socialsJson, ownerAvatarJson] = await Promise.all([
      robloxFetch(`/v1/groups/${groupId}/roles`, { sub: "groups" }).catch(() => null),
      robloxFetch(
        `/v1/groups/icons?groupIds=${groupId}&size=420x420&format=Png&isCircular=false`,
        { sub: "thumbnails" }
      ).catch(() => null),
      robloxFetch(`/v2/groups/${groupId}/games?accessFilter=Public&limit=30&sortOrder=Desc`, {
        sub: "games",
      }).catch(() => null),
      robloxFetch(`/v1/groups/${groupId}/social-links`, { sub: "groups" }).catch(() => null),
      info?.owner?.userId
        ? robloxFetch(
            `/v1/users/avatar-headshot?userIds=${info.owner.userId}&size=150x150&format=Png&isCircular=true`,
            { sub: "thumbnails" }
          ).catch(() => null)
        : Promise.resolve(null),
    ]);

    const roleRows: Raw[] = rolesJson?.roles ?? [];
    const totalMembers = Number(info.memberCount) || 0;
    const roles = roleRows
      .map((r) => ({
        id: Number(r?.id),
        name: String(r?.name ?? ""),
        rank: Number(r?.rank) || 0,
        memberCount: Number(r?.memberCount) || 0,
        share: totalMembers ? ((Number(r?.memberCount) || 0) / totalMembers) * 100 : 0,
      }))
      .sort((a, b) => b.rank - a.rank);

    const universeIds = (gamesJson?.data ?? [])
      .map((g: Raw) => Number(g?.id))
      .filter((n: number) => Number.isFinite(n) && n > 0)
      .slice(0, 24);
    const games = universeIds.length ? await getGameDetails(universeIds).catch(() => []) : [];

    const payload: GroupPayload = {
      id: Number(info.id),
      name: String(info.name ?? "Группа"),
      description: String(info.description ?? ""),
      memberCount: totalMembers,
      owner: info.owner
        ? {
            userId: Number(info.owner.userId),
            username: String(info.owner.username ?? ""),
            displayName: String(info.owner.displayName ?? info.owner.username ?? ""),
            avatar: ownerAvatarJson?.data?.[0]?.imageUrl ?? null,
          }
        : null,
      shout: info.shout?.body
        ? {
            body: String(info.shout.body),
            poster: String(info.shout.poster?.username ?? info.shout.poster?.displayName ?? ""),
            created: String(info.shout.updated ?? info.shout.created ?? ""),
          }
        : null,
      icon: iconJson?.data?.[0]?.imageUrl ?? null,
      verified: Boolean(info.hasVerifiedBadge),
      publicEntry: Boolean(info.publicEntryAllowed),
      locked: Boolean(info.isLocked),
      roles,
      games,
      socials: (socialsJson?.data ?? []).map((s: Raw) => ({
        type: String(s?.type ?? "Link"),
        url: String(s?.url ?? ""),
        title: String(s?.title ?? s?.type ?? "Ссылка"),
      })),
      stats: {
        playing: games.reduce((a, g) => a + g.playing, 0),
        visits: games.reduce((a, g) => a + g.visits, 0),
        games: games.length,
        topRole: roles[0]?.name ?? "—",
      },
    };

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=180" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Roblox недоступен" },
      { status: 502 }
    );
  }
}
