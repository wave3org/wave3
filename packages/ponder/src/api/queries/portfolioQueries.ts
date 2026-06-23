import { and, count, desc, eq, gt, gte, inArray, or, sql } from "drizzle-orm";

type SongPurchase = {
  songId: string;
  buyer: string;
  parts: string;
  blockTimestamp: number;
};

/** List part purchase events, ordered by newest first. */
export async function fetchSongPurchases(
  db: AnyDb,
  tables: { songPurchases: any },
  buyer?: string,
  limit = 10000,
): Promise<SongPurchase[]> {
  const rows = await db
    .select({
      songId: tables.songPurchases.songId,
      buyer: tables.songPurchases.buyer,
      parts: tables.songPurchases.parts,
      blockTimestamp: tables.songPurchases.blockTimestamp,
    })
    .from(tables.songPurchases)
    .where(buyer ? eq(tables.songPurchases.buyer, buyer as `0x${string}`) : undefined)
    .orderBy(desc(tables.songPurchases.blockTimestamp))
    .limit(limit);

  return rows.map((p: any) => ({
    songId: p.songId.toString(),
    buyer: p.buyer,
    parts: p.parts.toString(),
    blockTimestamp: p.blockTimestamp,
  }));
}

// Minimal structural types — compatible with both ponder's onchainTable and plain pgTable for tests.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDb = any;
type Tables = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  songShareBalances: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  songPlays: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  royaltyDistributions: any;
};

export type CurrentPosition = {
  songId: bigint;
  boughtParts: bigint;
  firstPurchaseTimestamp: number;
  lastPurchaseTimestamp: number;
};

/** Returns current ERC-1155 share balances for a holder (parts > 0). */
export async function fetchCurrentPositions(
  db: AnyDb,
  tables: Pick<Tables, "songShareBalances">,
  holder: string,
): Promise<CurrentPosition[]> {
  return db
    .select({
      songId: tables.songShareBalances.songId,
      boughtParts: tables.songShareBalances.parts,
      firstPurchaseTimestamp: tables.songShareBalances.firstAcquiredTimestamp,
      lastPurchaseTimestamp: tables.songShareBalances.lastTransferTimestamp,
    })
    .from(tables.songShareBalances)
    .where(
      and(
        eq(tables.songShareBalances.holder, holder as `0x${string}`),
        gt(tables.songShareBalances.parts, 0n),
      )
    )
    .orderBy(desc(tables.songShareBalances.lastTransferTimestamp));
}

/** All-time play count per song, keyed by songId string. */
export async function fetchTotalPlaysBySongId(
  db: AnyDb,
  tables: Pick<Tables, "songPlays">,
  songIds: bigint[],
): Promise<Map<string, number>> {
  const rows = await db
    .select({ songId: tables.songPlays.songId, plays: count() })
    .from(tables.songPlays)
    .where(inArray(tables.songPlays.songId, songIds))
    .groupBy(tables.songPlays.songId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Map(rows.map((r: any) => [r.songId.toString(), r.plays]));
}

/**
 * Play count per song within the period, bounded by the user's buy date per song.
 * Effective cutoff per song = max(sinceTimestamp, firstPurchaseTimestamp).
 */
export async function fetchPeriodPlaysBySongId(
  db: AnyDb,
  tables: Pick<Tables, "songPlays">,
  positions: CurrentPosition[],
  sinceTimestamp: number,
): Promise<Map<string, number>> {
  const conditions = positions.map(p =>
    and(
      eq(tables.songPlays.songId, p.songId),
      gte(tables.songPlays.blockTimestamp, Math.max(sinceTimestamp, Number(p.firstPurchaseTimestamp))),
    )
  );
  const rows = await db
    .select({ songId: tables.songPlays.songId, plays: count() })
    .from(tables.songPlays)
    .where(or(...conditions))
    .groupBy(tables.songPlays.songId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new Map(rows.map((r: any) => [r.songId.toString(), r.plays]));
}

/** Royalties distributed to a holder after sinceTimestamp, grouped by song. */
export async function fetchEarningsByHolder(
  db: AnyDb,
  tables: Pick<Tables, "royaltyDistributions">,
  holder: string,
  sinceTimestamp: number,
): Promise<{ songId: string; earned: string }[]> {
  return db
    .select({
      songId: tables.royaltyDistributions.songId,
      earned: sql<string>`cast(sum(${tables.royaltyDistributions.amount}) as text)`,
    })
    .from(tables.royaltyDistributions)
    .where(
      and(
        eq(tables.royaltyDistributions.holder, holder as `0x${string}`),
        gte(tables.royaltyDistributions.blockTimestamp, sinceTimestamp),
      )
    )
    .groupBy(tables.royaltyDistributions.songId);
}
