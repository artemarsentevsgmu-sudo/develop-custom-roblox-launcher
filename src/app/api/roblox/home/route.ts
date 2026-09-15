import { NextResponse } from "next/server";
import { getHome } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getHome();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=45, stale-while-revalidate=120" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Roblox недоступен" },
      { status: 502 }
    );
  }
}
