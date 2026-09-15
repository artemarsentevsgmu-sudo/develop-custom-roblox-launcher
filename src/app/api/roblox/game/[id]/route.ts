import { NextResponse } from "next/server";
import { getGameDetail } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const num = Number(id);
    if (!Number.isFinite(num) || num <= 0) {
      return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
    }
    const payload = await getGameDetail(num);
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=45, stale-while-revalidate=120" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Roblox недоступен";
    return NextResponse.json({ error: msg }, { status: msg.includes("не найден") ? 404 : 502 });
  }
}
