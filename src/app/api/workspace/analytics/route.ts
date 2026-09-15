import { NextResponse, type NextRequest } from "next/server";
import { getAnalytics, type Bucket } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const range = Math.min(Math.max(Number(p.get("range")) || 30, 7), 180);
    const bucketRaw = p.get("bucket") || "day";
    const bucket: Bucket = ["day", "week", "month"].includes(bucketRaw) ? (bucketRaw as Bucket) : "day";
    return NextResponse.json(await getAnalytics(range, bucket));
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка аналитики" },
      { status: 500 }
    );
  }
}
