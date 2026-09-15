import { NextResponse, type NextRequest } from "next/server";
import { applyBulkPricing, listItems, priceHistory } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [items, history] = await Promise.all([listItems(), priceHistory()]);
    return NextResponse.json({ items, history });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка загрузки предметов" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: number[] = Array.isArray(body?.ids) ? body.ids.map(Number).filter(Boolean) : [];
    const mode = String(body?.mode ?? "percent");
    if (!["percent", "absolute", "set", "reset"].includes(mode)) {
      return NextResponse.json({ error: "Неизвестный режим" }, { status: 400 });
    }
    const result = await applyBulkPricing({
      ids,
      mode: mode as "percent" | "absolute" | "set" | "reset",
      value: Number(body?.value) || 0,
      reason: body?.reason ? String(body.reason).slice(0, 120) : undefined,
      roundTo: Number(body?.roundTo) || 1,
    });
    const [items, history] = await Promise.all([listItems(), priceHistory()]);
    return NextResponse.json({ ...result, items, history });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Не удалось изменить цены" },
      { status: 500 }
    );
  }
}
