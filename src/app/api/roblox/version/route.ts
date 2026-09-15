import { NextResponse } from "next/server";
import { getVersions } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const payload = await getVersions();
    return NextResponse.json(payload, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Roblox недоступен" },
      { status: 502 }
    );
  }
}
