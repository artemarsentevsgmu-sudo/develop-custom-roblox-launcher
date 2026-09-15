import { NextResponse, type NextRequest } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { pinnedGames, prefs, privateServers, watchlist } from "@/db/schema";

export const dynamic = "force-dynamic";

/** One endpoint for launcher personalisation: pins, private servers, prefs, watchlist. */
export async function GET(req: NextRequest) {
  try {
    const what = req.nextUrl.searchParams.get("what") ?? "all";
    const out: Record<string, unknown> = {};
    if (what === "all" || what === "pins") {
      out.pins = await db.select().from(pinnedGames).orderBy(asc(pinnedGames.sort), desc(pinnedGames.createdAt));
    }
    if (what === "all" || what === "servers") {
      out.servers = await db.select().from(privateServers).orderBy(desc(privateServers.createdAt));
    }
    if (what === "all" || what === "watchlist") {
      out.watchlist = await db.select().from(watchlist).orderBy(desc(watchlist.createdAt));
    }
    if (what === "all" || what === "prefs") {
      const rows = await db.select().from(prefs);
      out.prefs = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    }
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка загрузки" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = String(body?.action ?? "");

    switch (action) {
      case "pin": {
        const g = body.game ?? {};
        const universeId = Number(g.universeId);
        if (!universeId) return NextResponse.json({ error: "Нет universeId" }, { status: 400 });
        const existing = await db
          .select()
          .from(pinnedGames)
          .where(eq(pinnedGames.universeId, universeId))
          .limit(1);
        if (existing.length) {
          await db.delete(pinnedGames).where(eq(pinnedGames.universeId, universeId));
        } else {
          await db.insert(pinnedGames).values({
            universeId,
            placeId: Number(g.placeId) || universeId,
            name: String(g.name ?? "Мир").slice(0, 120),
            iconUrl: g.iconUrl ? String(g.iconUrl) : null,
            sort: Number(g.sort) || 0,
          });
        }
        break;
      }
      case "unpin": {
        await db.delete(pinnedGames).where(eq(pinnedGames.universeId, Number(body.universeId) || 0));
        break;
      }
      case "addServer": {
        const s = body.server ?? {};
        if (!Number(s.placeId)) return NextResponse.json({ error: "Нужен placeId" }, { status: 400 });
        await db.insert(privateServers).values({
          label: String(s.label ?? "Приватный сервер").slice(0, 80),
          placeId: Number(s.placeId),
          universeId: Number(s.universeId) || null,
          gameName: s.gameName ? String(s.gameName).slice(0, 120) : null,
          iconUrl: s.iconUrl ? String(s.iconUrl) : null,
          linkCode: s.linkCode ? String(s.linkCode).slice(0, 200) : null,
          accessCode: s.accessCode ? String(s.accessCode).slice(0, 200) : null,
          note: s.note ? String(s.note).slice(0, 300) : null,
        });
        break;
      }
      case "removeServer": {
        await db.delete(privateServers).where(eq(privateServers.id, Number(body.id) || 0));
        break;
      }
      case "watch": {
        const w = body.item ?? {};
        const assetId = Number(w.assetId);
        if (!assetId) return NextResponse.json({ error: "Нет assetId" }, { status: 400 });
        const existing = await db.select().from(watchlist).where(eq(watchlist.assetId, assetId)).limit(1);
        if (existing.length) {
          await db.delete(watchlist).where(eq(watchlist.assetId, assetId));
        } else {
          await db.insert(watchlist).values({
            assetId,
            name: String(w.name ?? "Предмет").slice(0, 140),
            thumb: w.thumb ? String(w.thumb) : null,
            price: Number(w.price) || null,
            lastPrice: Number(w.price) || null,
            kind: String(w.kind ?? "Asset"),
          });
        }
        break;
      }
      case "prefs": {
        const key = String(body.key ?? "ui");
        const value = body.value ?? {};
        await db
          .insert(prefs)
          .values({ key, value, updatedAt: new Date() })
          .onConflictDoUpdate({ target: prefs.key, set: { value, updatedAt: new Date() } });
        break;
      }
      default:
        return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
    }

    const [pins, servers, watch, prefRows] = await Promise.all([
      db.select().from(pinnedGames).orderBy(asc(pinnedGames.sort), desc(pinnedGames.createdAt)),
      db.select().from(privateServers).orderBy(desc(privateServers.createdAt)),
      db.select().from(watchlist).orderBy(desc(watchlist.createdAt)),
      db.select().from(prefs),
    ]);
    return NextResponse.json({
      ok: true,
      pins,
      servers,
      watchlist: watch,
      prefs: Object.fromEntries(prefRows.map((r) => [r.key, r.value])),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка сохранения" },
      { status: 500 }
    );
  }
}

export const _unused = and;
