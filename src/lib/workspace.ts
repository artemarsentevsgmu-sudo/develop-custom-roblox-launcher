/* Creator workspace: pricing, payouts and the local ledger.
 *
 * IMPORTANT: nothing here is invented. The workspace starts completely empty
 * and only ever contains what the user (or a verified Roblox API response)
 * puts into it. Roblox's own creator endpoints (create.roblox.com revenue,
 * group payouts) require an authenticated session bound to the creator's
 * device, so when that data cannot be reached we surface an honest
 * "unavailable" state instead of fabricating numbers.
 */
import { and, asc, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { creatorItems, payoutRuns, priceChanges, salesDaily, transactions } from "@/db/schema";

/** No seeding — the workspace is empty until real data is imported. */
export async function ensureSeeded(): Promise<void> {
  return;
}

/* ---------------- analytics ---------------- */

export type Bucket = "day" | "week" | "month";

export interface SeriesPoint {
  label: string;
  iso: string;
  units: number;
  gross: number;
  net: number;
  impressions: number;
}

export interface AnalyticsPayload {
  range: number;
  bucket: Bucket;
  series: SeriesPoint[];
  totals: {
    units: number;
    gross: number;
    net: number;
    impressions: number;
    conversion: number;
    avgPrice: number;
  };
  deltas: { units: number; net: number };
  topItems: {
    id: number;
    assetId: number;
    name: string;
    category: string;
    price: number;
    units: number;
    net: number;
    share: number;
    spark: number[];
  }[];
  byCategory: { category: string; net: number; units: number }[];
  best: { day: string; net: number } | null;
}

const BUCKET_SQL: Record<Bucket, string> = {
  day: "day",
  week: "week",
  month: "month",
};

export async function getAnalytics(rangeDays: number, bucket: Bucket): Promise<AnalyticsPayload> {
  await ensureSeeded();
  const since = new Date(Date.now() - rangeDays * 86_400_000);
  const sinceKey = since.toISOString().slice(0, 10);
  const trunc = BUCKET_SQL[bucket] ?? "day";

  const seriesRows = await db.execute<{
    bucket: string;
    units: string;
    gross: string;
    net: string;
    impressions: string;
  }>(
    sql`select to_char(date_trunc(${sql.raw(`'${trunc}'`)}, day::timestamp), 'YYYY-MM-DD') as bucket,
               sum(units)::text as units,
               sum(gross)::text as gross,
               sum(net)::text as net,
               sum(impressions)::text as impressions
        from sales_daily
        where day >= ${sinceKey}
        group by 1
        order by 1 asc`
  );

  const fmtLabel = (iso: string): string => {
    const d = new Date(`${iso}T00:00:00Z`);
    if (bucket === "month")
      return new Intl.DateTimeFormat("ru-RU", { month: "short", year: "2-digit", timeZone: "UTC" }).format(d);
    if (bucket === "week")
      return `${new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" }).format(d)}`;
    return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", timeZone: "UTC" }).format(d);
  };

  const series: SeriesPoint[] = (seriesRows.rows ?? []).map((r) => ({
    iso: r.bucket,
    label: fmtLabel(r.bucket),
    units: Number(r.units) || 0,
    gross: Number(r.gross) || 0,
    net: Number(r.net) || 0,
    impressions: Number(r.impressions) || 0,
  }));

  const totals = series.reduce(
    (a, p) => ({
      units: a.units + p.units,
      gross: a.gross + p.gross,
      net: a.net + p.net,
      impressions: a.impressions + p.impressions,
      conversion: 0,
      avgPrice: 0,
    }),
    { units: 0, gross: 0, net: 0, impressions: 0, conversion: 0, avgPrice: 0 }
  );
  totals.conversion = totals.impressions ? (totals.units / totals.impressions) * 100 : 0;
  totals.avgPrice = totals.units ? Math.round(totals.gross / totals.units) : 0;

  // previous period comparison
  const prevSince = new Date(Date.now() - rangeDays * 2 * 86_400_000).toISOString().slice(0, 10);
  const prevRows = await db.execute<{ units: string; net: string }>(
    sql`select coalesce(sum(units),0)::text as units, coalesce(sum(net),0)::text as net
        from sales_daily where day >= ${prevSince} and day < ${sinceKey}`
  );
  const prev = prevRows.rows?.[0];
  const prevUnits = Number(prev?.units) || 0;
  const prevNet = Number(prev?.net) || 0;
  const deltas = {
    units: prevUnits ? ((totals.units - prevUnits) / prevUnits) * 100 : 0,
    net: prevNet ? ((totals.net - prevNet) / prevNet) * 100 : 0,
  };

  // top items
  const topRows = await db.execute<{
    id: number;
    asset_id: string;
    name: string;
    category: string;
    price: number;
    units: string;
    net: string;
  }>(
    sql`select i.id, i.asset_id::text, i.name, i.category, i.price,
               sum(s.units)::text as units, sum(s.net)::text as net
        from sales_daily s join creator_items i on i.id = s.item_id
        where s.day >= ${sinceKey}
        group by i.id, i.asset_id, i.name, i.category, i.price
        order by sum(s.net) desc
        limit 10`
  );
  const topIds = (topRows.rows ?? []).map((r) => Number(r.id));
  const sparkMap = new Map<number, number[]>();
  if (topIds.length) {
    const sparkRows = await db
      .select({ itemId: salesDaily.itemId, day: salesDaily.day, net: salesDaily.net })
      .from(salesDaily)
      .where(and(gte(salesDaily.day, sinceKey), inArray(salesDaily.itemId, topIds)))
      .orderBy(asc(salesDaily.day));
    for (const r of sparkRows) {
      const arr = sparkMap.get(r.itemId) ?? [];
      arr.push(r.net);
      sparkMap.set(r.itemId, arr);
    }
  }
  const topItems = (topRows.rows ?? []).map((r) => {
    const net = Number(r.net) || 0;
    const full = sparkMap.get(Number(r.id)) ?? [];
    const step = Math.max(1, Math.ceil(full.length / 24));
    return {
      id: Number(r.id),
      assetId: Number(r.asset_id),
      name: r.name,
      category: r.category,
      price: Number(r.price) || 0,
      units: Number(r.units) || 0,
      net,
      share: totals.net ? (net / totals.net) * 100 : 0,
      spark: full.filter((_, i) => i % step === 0).slice(-24),
    };
  });

  const catRows = await db.execute<{ category: string; net: string; units: string }>(
    sql`select i.category, sum(s.net)::text as net, sum(s.units)::text as units
        from sales_daily s join creator_items i on i.id = s.item_id
        where s.day >= ${sinceKey}
        group by i.category order by sum(s.net) desc`
  );
  const byCategory = (catRows.rows ?? []).map((r) => ({
    category: r.category,
    net: Number(r.net) || 0,
    units: Number(r.units) || 0,
  }));

  const bestRow = await db.execute<{ day: string; net: string }>(
    sql`select to_char(day,'YYYY-MM-DD') as day, sum(net)::text as net from sales_daily
        where day >= ${sinceKey} group by day order by sum(net) desc limit 1`
  );
  const b = bestRow.rows?.[0];

  return {
    range: rangeDays,
    bucket,
    series,
    totals,
    deltas,
    topItems,
    byCategory,
    best: b ? { day: b.day, net: Number(b.net) || 0 } : null,
  };
}

/* ---------------- items & pricing ---------------- */

export async function listItems() {
  await ensureSeeded();
  const rows = await db.execute<{
    id: number;
    asset_id: string;
    name: string;
    category: string;
    price: number;
    base_price: number;
    active: boolean;
    units: string;
    net: string;
  }>(
    sql`select i.id, i.asset_id::text, i.name, i.category, i.price, i.base_price, i.active,
               coalesce(sum(s.units),0)::text as units, coalesce(sum(s.net),0)::text as net
        from creator_items i left join sales_daily s on s.item_id = i.id
        group by i.id order by i.name asc`
  );
  return (rows.rows ?? []).map((r) => ({
    id: Number(r.id),
    assetId: Number(r.asset_id),
    name: r.name,
    category: r.category,
    price: Number(r.price) || 0,
    basePrice: Number(r.base_price) || 0,
    active: Boolean(r.active),
    units: Number(r.units) || 0,
    net: Number(r.net) || 0,
  }));
}

export interface BulkPriceInput {
  ids: number[];
  mode: "percent" | "absolute" | "set" | "reset";
  value: number;
  reason?: string;
  roundTo?: number;
}

export async function applyBulkPricing(input: BulkPriceInput) {
  await ensureSeeded();
  const { ids, mode, value, reason, roundTo = 1 } = input;
  if (!ids.length) return { updated: 0, changes: [] as { id: number; from: number; to: number }[] };

  const items = await db.select().from(creatorItems).where(inArray(creatorItems.id, ids));
  const changes: { id: number; from: number; to: number }[] = [];

  for (const item of items) {
    let next = item.price;
    if (mode === "percent") next = Math.round(item.price * (1 + value / 100));
    else if (mode === "absolute") next = item.price + Math.round(value);
    else if (mode === "set") next = Math.round(value);
    else if (mode === "reset") next = item.basePrice;
    if (roundTo > 1) next = Math.max(roundTo, Math.round(next / roundTo) * roundTo);
    next = Math.max(0, Math.min(1_000_000, next));
    if (next === item.price) continue;
    await db.update(creatorItems).set({ price: next }).where(eq(creatorItems.id, item.id));
    await db.insert(priceChanges).values({
      itemId: item.id,
      oldPrice: item.price,
      newPrice: next,
      reason: reason ?? mode,
    });
    changes.push({ id: item.id, from: item.price, to: next });
  }
  return { updated: changes.length, changes };
}

export async function priceHistory(limit = 40) {
  const rows = await db.execute<{
    id: number;
    name: string;
    old_price: number;
    new_price: number;
    reason: string;
    created_at: string;
  }>(
    sql`select p.id, i.name, p.old_price, p.new_price, p.reason, p.created_at
        from price_changes p join creator_items i on i.id = p.item_id
        order by p.created_at desc limit ${limit}`
  );
  return (rows.rows ?? []).map((r) => ({
    id: Number(r.id),
    name: r.name,
    oldPrice: Number(r.old_price),
    newPrice: Number(r.new_price),
    reason: r.reason,
    createdAt: r.created_at,
  }));
}

/* ---------------- transactions ---------------- */

export async function listTransactions(opts: { limit?: number; kind?: string } = {}) {
  await ensureSeeded();
  const limit = Math.min(opts.limit ?? 120, 2000);
  const base = db.select().from(transactions).$dynamic();
  const q = opts.kind && opts.kind !== "all" ? base.where(eq(transactions.kind, opts.kind)) : base;
  const rows = await q.orderBy(desc(transactions.happenedAt)).limit(limit);
  return rows;
}

export async function transactionSummary() {
  await ensureSeeded();
  const rows = await db.execute<{ kind: string; total: string; count: string }>(
    sql`select kind, sum(amount)::text as total, count(*)::text as count from transactions group by kind`
  );
  const [latest] = await db
    .select({ balance: transactions.balanceAfter })
    .from(transactions)
    .orderBy(desc(transactions.happenedAt))
    .limit(1);
  return {
    balance: latest?.balance ?? 0,
    byKind: (rows.rows ?? []).map((r) => ({
      kind: r.kind,
      total: Number(r.total) || 0,
      count: Number(r.count) || 0,
    })),
  };
}

/* ---------------- payouts ---------------- */

export interface PayoutEntry {
  userId: number;
  username: string;
  role?: string;
  amount: number;
  percent?: number;
}

export async function savePayoutRun(run: {
  groupId?: number;
  groupName?: string;
  mode: string;
  note?: string;
  entries: PayoutEntry[];
}) {
  await ensureSeeded();
  const total = run.entries.reduce((a, e) => a + e.amount, 0);
  const [row] = await db
    .insert(payoutRuns)
    .values({
      groupId: run.groupId ?? null,
      groupName: run.groupName ?? null,
      total,
      mode: run.mode,
      note: run.note ?? null,
      entries: run.entries,
    })
    .returning();

  const [latest] = await db
    .select({ balance: transactions.balanceAfter })
    .from(transactions)
    .orderBy(desc(transactions.happenedAt))
    .limit(1);
  const balance = (latest?.balance ?? 0) - total;
  await db.insert(transactions).values({
    kind: "Payout",
    title: `Выплата ${run.entries.length} участникам${run.groupName ? ` · ${run.groupName}` : ""}`,
    counterparty: run.groupName ?? "Группа",
    amount: -total,
    balanceAfter: balance,
  });
  return row;
}

export async function listPayoutRuns(limit = 20) {
  await ensureSeeded();
  return db.select().from(payoutRuns).orderBy(desc(payoutRuns.createdAt)).limit(limit);
}
