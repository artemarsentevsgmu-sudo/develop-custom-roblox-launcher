import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { prefs } from "@/db/schema";
import { getAnalytics, transactionSummary } from "@/lib/workspace";
import { getGameDetails } from "@/lib/roblox";
import { fmtCompact } from "@/lib/shared";

export const dynamic = "force-dynamic";

const KEY = "discord";

interface DiscordConfig {
  webhook: string;
  enabled: boolean;
  botName: string;
  trackUniverseIds: number[];
  lastSentAt?: string;
}

const DEFAULTS: DiscordConfig = {
  webhook: "",
  enabled: false,
  botName: "RoLaunch Bot",
  trackUniverseIds: [],
};

async function readConfig(): Promise<DiscordConfig> {
  const [row] = await db.select().from(prefs).where(eq(prefs.key, KEY)).limit(1);
  return { ...DEFAULTS, ...((row?.value as Partial<DiscordConfig>) ?? {}) };
}

async function writeConfig(cfg: DiscordConfig) {
  await db
    .insert(prefs)
    .values({ key: KEY, value: cfg, updatedAt: new Date() })
    .onConflictDoUpdate({ target: prefs.key, set: { value: cfg, updatedAt: new Date() } });
}

/** never leak the full webhook back to the browser */
function mask(url: string): string {
  if (!url) return "";
  const tail = url.slice(-6);
  return `https://discord.com/api/webhooks/•••••${tail}`;
}

export async function GET() {
  const cfg = await readConfig();
  return NextResponse.json({
    enabled: cfg.enabled,
    botName: cfg.botName,
    configured: Boolean(cfg.webhook),
    webhookMasked: mask(cfg.webhook),
    trackUniverseIds: cfg.trackUniverseIds,
    lastSentAt: cfg.lastSentAt ?? null,
  });
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const cfg = await readConfig();
    const next: DiscordConfig = {
      ...cfg,
      enabled: typeof body?.enabled === "boolean" ? body.enabled : cfg.enabled,
      botName: body?.botName ? String(body.botName).slice(0, 40) : cfg.botName,
      trackUniverseIds: Array.isArray(body?.trackUniverseIds)
        ? body.trackUniverseIds.map(Number).filter(Boolean).slice(0, 10)
        : cfg.trackUniverseIds,
    };
    if (typeof body?.webhook === "string") {
      const w = body.webhook.trim();
      if (w && !/^https:\/\/(canary\.|ptb\.)?discord(app)?\.com\/api\/webhooks\//.test(w)) {
        return NextResponse.json({ error: "Это не похоже на Discord webhook URL" }, { status: 400 });
      }
      next.webhook = w;
    }
    await writeConfig(next);
    return NextResponse.json({
      ok: true,
      enabled: next.enabled,
      botName: next.botName,
      configured: Boolean(next.webhook),
      webhookMasked: mask(next.webhook),
      trackUniverseIds: next.trackUniverseIds,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Ошибка настройки" },
      { status: 500 }
    );
  }
}

/** Build and push a rich stats embed to the configured Discord channel. */
export async function POST(req: NextRequest) {
  try {
    const cfg = await readConfig();
    if (!cfg.webhook) {
      return NextResponse.json({ error: "Сначала укажите webhook URL" }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    const kind = String(body?.kind ?? "sales");

    const fields: { name: string; value: string; inline?: boolean }[] = [];
    let title = "Сводка RoLaunch";
    let color = 0x7c5cff;

    if (kind === "games" && cfg.trackUniverseIds.length) {
      title = "📊 Статистика отслеживаемых миров";
      color = 0x35e0ff;
      const games = await getGameDetails(cfg.trackUniverseIds);
      for (const g of games.slice(0, 8)) {
        fields.push({
          name: g.name.slice(0, 60),
          value: `👥 **${fmtCompact(g.playing)}** онлайн · 👁 ${fmtCompact(g.visits)} визитов${
            g.rating != null ? ` · 👍 ${g.rating}%` : ""
          }`,
          inline: false,
        });
      }
      if (!fields.length) fields.push({ name: "Пусто", value: "Миры не найдены", inline: false });
    } else {
      title = "💰 Сводка продаж мастерской";
      const [a, summary] = await Promise.all([getAnalytics(30, "day"), transactionSummary()]);
      const top = a.topItems[0];
      fields.push(
        { name: "Доход за 30 дней", value: `**${fmtCompact(a.totals.net)} R$**`, inline: true },
        { name: "Продаж", value: `**${fmtCompact(a.totals.units)}** шт.`, inline: true },
        { name: "Баланс", value: `**${fmtCompact(summary.balance)} R$**`, inline: true },
        {
          name: "Динамика к прошлому периоду",
          value: `${a.deltas.net >= 0 ? "📈 +" : "📉 "}${a.deltas.net.toFixed(1)}% выручки`,
          inline: true,
        },
        { name: "Конверсия", value: `${a.totals.conversion.toFixed(2)}%`, inline: true }
      );
      if (top) {
        fields.push({
          name: "🏆 Лидер продаж",
          value: `**${top.name}** — ${fmtCompact(top.net)} R$ (${top.units} шт.)`,
          inline: false,
        });
      }
    }

    const payload = {
      username: cfg.botName || "RoLaunch Bot",
      embeds: [
        {
          title,
          color,
          fields,
          footer: { text: "RoLaunch · лаунчер Roblox" },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await fetch(cfg.webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(9000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Discord отклонил запрос (${res.status}) ${text.slice(0, 120)}` },
        { status: 502 }
      );
    }
    await writeConfig({ ...cfg, lastSentAt: new Date().toISOString() });
    return NextResponse.json({ ok: true, sentAt: new Date().toISOString(), fields: fields.length });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Не удалось отправить" },
      { status: 500 }
    );
  }
}
