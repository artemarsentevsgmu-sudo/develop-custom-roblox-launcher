import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/roblox";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const payload = await getCatalog(req.nextUrl.searchParams);
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
