import { NextResponse, type NextRequest } from "next/server";
import { getCatalog } from "@/lib/roblox";

export const dynamic = "force-dynamic";

/** Competitor price monitoring: pull similar marketplace items and
 *  summarise the price distribution around the user's own price. */
export async function GET(req: NextRequest) {
  try {
    const p = req.nextUrl.searchParams;
    const keyword = (p.get("keyword") || "").trim();
    const myPrice = Number(p.get("price")) || 0;
    const category = p.get("category") || "All";
    if (!keyword) return NextResponse.json({ error: "Нужно ключевое слово" }, { status: 400 });

    const params = new URLSearchParams({
      category,
      keyword,
      limit: "30",
      sortType: "2",
    });
    const { items } = await getCatalog(params);
    const priced = items.filter((i) => typeof i.price === "number" && (i.price ?? 0) > 0);
    const prices = priced.map((i) => i.price as number).sort((a, b) => a - b);

    const pick = (q: number) => (prices.length ? prices[Math.floor((prices.length - 1) * q)] : 0);
    const avg = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const cheaper = myPrice ? prices.filter((x) => x < myPrice).length : 0;

    return NextResponse.json({
      keyword,
      count: priced.length,
      stats: {
        min: prices[0] ?? 0,
        p25: pick(0.25),
        median: pick(0.5),
        p75: pick(0.75),
        max: prices[prices.length - 1] ?? 0,
        avg,
      },
      position: myPrice
        ? {
            myPrice,
            cheaperThanMine: cheaper,
            percentile: prices.length ? Math.round((cheaper / prices.length) * 100) : 0,
            verdict:
              !prices.length
                ? "нет данных"
                : myPrice > pick(0.75)
                  ? "выше рынка"
                  : myPrice < pick(0.25)
                    ? "ниже рынка"
                    : "в рынке",
          }
        : null,
      competitors: priced
        .slice(0, 18)
        .map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          thumb: i.thumb,
          type: i.type,
          favorites: i.favorites,
          limited: i.limited,
        }))
        .sort((a, b) => (a.price ?? 0) - (b.price ?? 0)),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Не удалось сравнить" },
      { status: 502 }
    );
  }
}
