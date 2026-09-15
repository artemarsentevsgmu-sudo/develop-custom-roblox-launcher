import { NextResponse, type NextRequest } from "next/server";
import { robloxFetch } from "@/lib/roblox";

export const dynamic = "force-dynamic";

type Raw = Record<string, any>;

export async function GET(req: NextRequest) {
  try {
    const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 60);
    if (!q) return NextResponse.json({ groups: [] });

    const j = await robloxFetch(
      `/v1/groups/search?keyword=${encodeURIComponent(q)}&prioritizeExactMatch=true&limit=25`,
      { sub: "groups" }
    );
    const raw: Raw[] = j?.data ?? [];
    const ids = raw.map((g) => Number(g?.id)).filter(Boolean).slice(0, 25);

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
        /* optional */
      }
    }

    return NextResponse.json({
      groups: raw.map((g) => ({
        id: Number(g?.id),
        name: String(g?.name ?? ""),
        description: String(g?.description ?? ""),
        memberCount: Number(g?.memberCount) || 0,
        verified: Boolean(g?.hasVerifiedBadge),
        publicEntry: Boolean(g?.publicEntryAllowed),
        icon: icons.get(Number(g?.id)) ?? null,
      })),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Roblox недоступен" },
      { status: 502 }
    );
  }
}
