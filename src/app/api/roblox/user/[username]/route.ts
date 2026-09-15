import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ username: string }> }) {
  try {
    const { username } = await ctx.params;
    const name = decodeURIComponent(username).slice(0, 60);
    if (!name) return NextResponse.json({ error: "Пустой ник" }, { status: 400 });
    const payload = await getUserProfile(name);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=180" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Roblox недоступен";
    return NextResponse.json({ error: msg }, { status: msg.includes("не найден") ? 404 : 502 });
  }
}
