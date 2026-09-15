import { NextResponse, type NextRequest } from "next/server";
import { getGameDetails, resolvePlaces } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const raw = req.nextUrl.searchParams.get("ids") || "";
    const type = req.nextUrl.searchParams.get("type") || "universe";
    const ids = raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
      .slice(0, 60);
    if (!ids.length) return NextResponse.json({ data: [] });
    const universes = type === "place" ? await resolvePlaces(ids) : ids;
    const data = await getGameDetails(universes);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Roblox недоступен" },
      { status: 502 }
    );
  }
}
