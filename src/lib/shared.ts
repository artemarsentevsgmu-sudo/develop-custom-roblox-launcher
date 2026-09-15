/* Shared types + pure helpers (safe to import on both server and client) */

export type CreatorType = "User" | "Group" | string;

export interface GameSummary {
  universeId: number;
  placeId: number;
  name: string;
  creatorName: string;
  creatorId: number;
  creatorType?: CreatorType;
  creatorVerified?: boolean;
  playing: number;
  visits: number;
  favorites: number;
  maxPlayers: number;
  upVotes: number;
  downVotes: number;
  rating: number | null;
  iconUrl: string | null;
  genre?: string;
  created?: string;
  updated?: string;
  price?: number | null;
  mediaUrl?: string | null;
}

export interface GamePass {
  id: number;
  name: string;
  price: number | null;
  iconUrl: string | null;
}

export interface GameBadge {
  id: number;
  name: string;
  description: string;
  awarded?: number;
  winRate?: number;
}

export interface GameServer {
  id: string;
  playing: number;
  maxPlayers: number;
  fps: number;
  ping: number;
}

export interface GameDetail extends GameSummary {
  description: string;
  media: string[];
  passes: GamePass[];
  badges: GameBadge[];
  servers: GameServer[];
  similar: GameSummary[];
}

export interface Rail {
  key: string;
  title: string;
  items: GameSummary[];
}

export interface HomePayload {
  hero: GameSummary[];
  rails: Rail[];
  live: boolean;
  stats: { games: number; playingNow: number };
}

export interface ChartsPayload {
  top: GameSummary[];
  rated: GameSummary[];
  trending: GameSummary[];
}

export interface ProfilePayload {
  user: {
    id: number;
    name: string;
    displayName: string;
    description: string;
    created: string;
    isBanned: boolean;
    verified: boolean;
  };
  premium: boolean;
  counts: { friends: number; followers: number; followings: number };
  avatar: string | null;
  avatarFull: string | null;
  games: GameSummary[];
}

export interface SearchPayload {
  games: GameSummary[];
  users: {
    id: number;
    name: string;
    displayName: string;
    description: string;
    avatar: string | null;
  }[];
}

export interface CatalogItem {
  id: number;
  name: string;
  type: "Asset" | "Bundle";
  price: number | null;
  priceStatus: string;
  limited: boolean;
  collectible: boolean;
  premium: boolean;
  favorites: number;
  thumb: string | null;
  parts?: number;
}

export interface CatalogPayload {
  items: CatalogItem[];
  nextCursor: string | null;
}

export interface VersionsPayload {
  player: { version: string; guid: string };
  studio: { version: string; guid: string };
  fetchedAt: string;
}

export interface FavEntry {
  universeId: number;
  placeId: number;
  name: string;
  iconUrl: string | null;
  at: number;
}

export interface MePayload {
  user: { id: number; name: string; displayName: string; verified: boolean };
  avatar: string | null;
  robux: number | null;
  premium: boolean;
  counts: { friends: number; requests: number; messages: number; notifications: number };
  continuePlaying: GameSummary[];
}

export interface LaunchTarget {
  placeId: number;
  universeId?: number;
  name: string;
  iconUrl?: string | null;
  jobId?: string;
}

/* ---------- formatting ---------- */

export function fmtCompact(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "0";
  try {
    return new Intl.NumberFormat("ru-RU", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(n);
  } catch {
    return String(n);
  }
}

export function fmtFull(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "0";
  try {
    return new Intl.NumberFormat("ru-RU").format(n);
  } catch {
    return String(n);
  }
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

export function pct(up: number, down: number): number | null {
  const t = up + down;
  if (!t) return null;
  return Math.round((up / t) * 100);
}
