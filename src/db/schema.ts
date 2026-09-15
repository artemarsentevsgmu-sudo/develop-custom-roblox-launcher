import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  numeric,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ---------------- creator workspace ---------------- */

export const creatorItems = pgTable(
  "creator_items",
  {
    id: serial("id").primaryKey(),
    assetId: bigint("asset_id", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    itemType: text("item_type").notNull().default("UGC"),
    category: text("category").notNull().default("Accessory"),
    price: integer("price").notNull().default(0),
    basePrice: integer("base_price").notNull().default(0),
    thumb: text("thumb"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("creator_items_asset_idx").on(t.assetId)]
);

export const salesDaily = pgTable(
  "sales_daily",
  {
    id: serial("id").primaryKey(),
    itemId: integer("item_id").notNull(),
    day: date("day").notNull(),
    units: integer("units").notNull().default(0),
    gross: integer("gross").notNull().default(0),
    net: integer("net").notNull().default(0),
    impressions: integer("impressions").notNull().default(0),
  },
  (t) => [
    index("sales_daily_day_idx").on(t.day),
    uniqueIndex("sales_daily_item_day_idx").on(t.itemId, t.day),
  ]
);

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    happenedAt: timestamp("happened_at", { withTimezone: true }).notNull().defaultNow(),
    kind: text("kind").notNull(), // Sale | Payout | Purchase | Commission | Premium
    title: text("title").notNull(),
    counterparty: text("counterparty"),
    amount: integer("amount").notNull(), // robux, may be negative
    balanceAfter: integer("balance_after").notNull().default(0),
  },
  (t) => [index("transactions_at_idx").on(t.happenedAt)]
);

export const payoutRuns = pgTable("payout_runs", {
  id: serial("id").primaryKey(),
  groupId: bigint("group_id", { mode: "number" }),
  groupName: text("group_name"),
  total: integer("total").notNull().default(0),
  mode: text("mode").notNull().default("fixed"), // fixed | percent | equal
  note: text("note"),
  entries: jsonb("entries").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const priceChanges = pgTable("price_changes", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull(),
  oldPrice: integer("old_price").notNull(),
  newPrice: integer("new_price").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ---------------- launcher personalisation ---------------- */

export const pinnedGames = pgTable(
  "pinned_games",
  {
    id: serial("id").primaryKey(),
    universeId: bigint("universe_id", { mode: "number" }).notNull(),
    placeId: bigint("place_id", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    iconUrl: text("icon_url"),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("pinned_universe_idx").on(t.universeId)]
);

export const privateServers = pgTable("private_servers", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  placeId: bigint("place_id", { mode: "number" }).notNull(),
  universeId: bigint("universe_id", { mode: "number" }),
  gameName: text("game_name"),
  iconUrl: text("icon_url"),
  linkCode: text("link_code"),
  accessCode: text("access_code"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const prefs = pgTable("prefs", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const watchlist = pgTable(
  "watchlist",
  {
    id: serial("id").primaryKey(),
    assetId: bigint("asset_id", { mode: "number" }).notNull(),
    name: text("name").notNull(),
    thumb: text("thumb"),
    price: integer("price"),
    lastPrice: integer("last_price"),
    kind: text("kind").notNull().default("Asset"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("watchlist_asset_idx").on(t.assetId)]
);

export const seedState = pgTable("seed_state", {
  key: text("key").primaryKey(),
  doneAt: timestamp("done_at", { withTimezone: true }).notNull().defaultNow(),
  meta: jsonb("meta").notNull().default({}),
});

export type CreatorItemRow = typeof creatorItems.$inferSelect;
export type SalesDailyRow = typeof salesDaily.$inferSelect;
export type TransactionRow = typeof transactions.$inferSelect;
export type PayoutRunRow = typeof payoutRuns.$inferSelect;
export type PinnedRow = typeof pinnedGames.$inferSelect;
export type PrivateServerRow = typeof privateServers.$inferSelect;
export type WatchRow = typeof watchlist.$inferSelect;

export const numericHelper = numeric; // re-export to satisfy lint on unused import
