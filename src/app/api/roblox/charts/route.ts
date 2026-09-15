import { NextResponse } from "next/server";
import { getCharts } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getCharts();
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
