import { NextResponse, type NextRequest } from "next/server";
import { robloxFetch } from "@/lib/roblox";

export const dynamic = "force-dynamic";

type Raw = Record<string, any>;

/** Members of a specific role — used to build payout recipient lists. */
export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const groupId = Number(p.get("groupId"));
    const roleId = Number(p.get("roleId"));
    // Roblox only accepts these page sizes — snap to the nearest allowed one
    const allowed = [10, 25, 50, 100];
    const want = Number(p.get("limit")) || 25;
    const limit = allowed.reduce((a, b) => (Math.abs(b - want) < Math.abs(a - want) ? b : a));
    if (!groupId) return NextResponse.json({ error: "Не указана группа" }, { status: 400 });

    let raw: Raw[] = [];
    if (roleId) {
      const j = await robloxFetch(
        `/v1/groups/${groupId}/roles/${roleId}/users?limit=${limit}&sortOrder=Desc`,
        { sub: "groups" }
      );
      raw = (j?.data ?? []).map((u: Raw) => ({
        userId: Number(u?.userId ?? u?.id),
        username: String(u?.username ?? u?.name ?? ""),
        displayName: String(u?.displayName ?? u?.username ?? ""),
      }));
    } else {
      const j = await robloxFetch(`/v1/groups/${groupId}/users?limit=${limit}&sortOrder=Desc`, {
        sub: "groups",
      });
      raw = (j?.data ?? []).map((m: Raw) => ({
        userId: Number(m?.user?.userId),
        username: String(m?.user?.username ?? ""),
        displayName: String(m?.user?.displayName ?? m?.user?.username ?? ""),
        role: String(m?.role?.name ?? ""),
      }));
    }

    const ids = raw.map((u) => Number(u.userId)).filter(Boolean);
    const avatars = new Map<number, string>();
    if (ids.length) {
      try {
        const t = await robloxFetch(
          `/v1/users/avatar-headshot?${ids.map((i) => `userIds=${i}`).join("&")}&size=150x150&format=Png&isCircular=true`,
          { sub: "thumbnails" }
        );
        for (const e of t?.data ?? []) {
          if (e?.imageUrl) avatars.set(Number(e.targetId), e.imageUrl);
        }
      } catch {
        /* optional */
      }
    }

    return NextResponse.json({
      members: raw
        .filter((u) => u.userId)
        .map((u) => ({ ...u, avatar: avatars.get(Number(u.userId)) ?? null })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Roblox недоступен" },
      { status: 502 }
    );
  }
}
