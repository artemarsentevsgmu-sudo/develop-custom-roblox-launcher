import { NextResponse, type NextRequest } from "next/server";
import { robloxFetch } from "@/lib/roblox";

export const dynamic = "force-dynamic";

type Raw = Record<string, any>;

/** Minimum role rank that unlocks group statistics in the launcher. */
export const MANAGE_RANK = 254;

export interface UserGroupRow {
  id: number;
  name: string;
  memberCount: number;
  verified: boolean;
  icon: string | null;
  role: { id: number; name: string; rank: number };
  canManage: boolean;
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
    const who = (req.nextUrl.searchParams.get("user") || "").trim();
    if (!who) return NextResponse.json({ error: "Укажите ник или ID игрока" }, { status: 400 });

    const userId = await resolveUserId(who.slice(0, 60));
    if (!userId) return NextResponse.json({ error: "Игрок не найден" }, { status: 404 });

    const j = await robloxFetch(`/v2/users/${userId}/groups/roles`, { sub: "groups" });
    const raw: Raw[] = j?.data ?? [];

    const ids = raw.map((g) => Number(g?.group?.id)).filter(Boolean).slice(0, 60);
    const icons = new Map<number, string>();
    if (ids.length) {
      try {
        const t = await robloxFetch(
          `/v1/groups/icons?${ids.map((i) => `groupIds=${i}`).join("&")}&size=150x150&format=Png&isCircular=false`,
          { sub: "thumbnails" }
        );
        for (const e of t?.data ?? []) {
          if (e?.state === "Completed" && e?.imageUrl) icons.set(Number(e.targetId), e.imageUrl);
        }
      } catch {
        /* icons are optional */
      }
    }

    const groups: UserGroupRow[] = raw
      .map((g) => {
        const rank = Number(g?.role?.rank) || 0;
        const id = Number(g?.group?.id);
        return {
          id,
          name: String(g?.group?.name ?? ""),
          memberCount: Number(g?.group?.memberCount) || 0,
          verified: Boolean(g?.group?.hasVerifiedBadge),
          icon: icons.get(id) ?? null,
          role: {
            id: Number(g?.role?.id) || 0,
            name: String(g?.role?.name ?? ""),
            rank,
          },
          canManage: rank >= MANAGE_RANK,
        };
      })
      .filter((g) => g.id)
      .sort((a, b) => b.role.rank - a.role.rank || b.memberCount - a.memberCount);

    return NextResponse.json({
      userId,
      username: who,
      minRank: MANAGE_RANK,
      groups,
      manageable: groups.filter((g) => g.canManage).length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Roblox недоступен" },
      { status: 502 }
    );
  }
}
