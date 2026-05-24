import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { and, count, desc, eq, gte, inArray, or, sql } from "drizzle-orm";

const portfolio = new Hono();

/**
 * List part purchase events, ordered by newest first.
 * @query buyer - Filter by buyer address (optional).
 * @query limit - Max results (default 10000).
 * @returns { items: [{ songId, buyer, parts, blockTimestamp }] }
 */
portfolio.get("/song-purchases", async (c) => {
  const buyer = c.req.query("buyer");
  const limit = parseInt(c.req.query("limit") || "10000");

  const whereClause = buyer
    ? eq(schema.songPurchases.buyer, buyer.toLowerCase() as `0x${string}`)
    : undefined;

  const purchases = await db.query.songPurchases.findMany({
    columns: { songId: true, buyer: true, parts: true, blockTimestamp: true },
    where: whereClause,
    orderBy: [desc(schema.songPurchases.blockTimestamp)],
    limit,
  });

  return c.json({
    items: purchases.map(p => ({
      songId: p.songId.toString(),
      buyer: p.buyer,
      parts: p.parts.toString(),
      blockTimestamp: p.blockTimestamp,
    })),
  });
});

type AggregatedPosition = {
  songId: bigint;
  boughtParts: bigint;
  firstPurchaseTimestamp: number;
  lastPurchaseTimestamp: number;
};

/** Returns all song positions for a buyer, aggregating parts and timestamps across multiple purchases of the same song. */
async function fetchAggregatedPositions(buyer: string): Promise<AggregatedPosition[]> {
  return db
    .select({
      songId: schema.songPurchases.songId,
      boughtParts: sql<bigint>`sum(${schema.songPurchases.parts})`,
      firstPurchaseTimestamp: sql<number>`min(${schema.songPurchases.blockTimestamp})`,
      lastPurchaseTimestamp: sql<number>`max(${schema.songPurchases.blockTimestamp})`,
    })
    .from(schema.songPurchases)
    .where(eq(schema.songPurchases.buyer, buyer as `0x${string}`))
    .groupBy(schema.songPurchases.songId)
    .orderBy(desc(sql<number>`max(${schema.songPurchases.blockTimestamp})`));
}

/** Returns the all-time play count for each song, keyed by songId string. */
async function fetchTotalPlaysBySongId(songIds: bigint[]): Promise<Map<string, number>> {
  const rows = await db
    .select({ songId: schema.songPlays.songId, plays: count() })
    .from(schema.songPlays)
    .where(inArray(schema.songPlays.songId, songIds))
    .groupBy(schema.songPlays.songId);
  return new Map(rows.map(r => [r.songId.toString(), r.plays]));
}

// Only counts plays after the user bought their position, bounded by the period window.
// Effective cutoff per song = max(sinceTimestamp, firstPurchaseTimestamp)
async function fetchPeriodPlaysBySongId(
  positions: AggregatedPosition[],
  sinceTimestamp: number,
): Promise<Map<string, number>> {
  const conditions = positions.map(p =>
    and(
      eq(schema.songPlays.songId, p.songId),
      gte(schema.songPlays.blockTimestamp, Math.max(sinceTimestamp, Number(p.firstPurchaseTimestamp))),
    )
  );
  const rows = await db
    .select({ songId: schema.songPlays.songId, plays: count() })
    .from(schema.songPlays)
    .where(or(...conditions))
    .groupBy(schema.songPlays.songId);
  return new Map(rows.map(r => [r.songId.toString(), r.plays]));
}

/**
 * Aggregated portfolio positions for a buyer, based on purchase events.
 * @param buyer - Wallet address.
 * @query days - Period for playsInPeriod (default 30).
 * @returns { items: [{ songId, boughtParts, plays, playsInPeriod, periodDays, firstPurchaseTimestamp, lastPurchaseTimestamp }] }
 */
portfolio.get("/portfolio/positions/:buyer", async (c) => {
  const buyer = c.req.param("buyer").toLowerCase();
  const days = parseInt(c.req.query("days") || "30");
  const sinceTimestamp = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

  const positions = await fetchAggregatedPositions(buyer);
  if (positions.length === 0) return c.json({ items: [] });

  const songIds = positions.map(p => p.songId);
  const [totalPlaysBySongId, periodPlaysBySongId] = await Promise.all([
    fetchTotalPlaysBySongId(songIds),
    fetchPeriodPlaysBySongId(positions, sinceTimestamp),
  ]);

  return c.json({
    items: positions.map(p => ({
      songId: p.songId.toString(),
      boughtParts: String(p.boughtParts),
      plays: totalPlaysBySongId.get(p.songId.toString()) ?? 0,
      playsInPeriod: periodPlaysBySongId.get(p.songId.toString()) ?? 0,
      periodDays: days,
      firstPurchaseTimestamp: Number(p.firstPurchaseTimestamp),
      lastPurchaseTimestamp: Number(p.lastPurchaseTimestamp),
    })),
  });
});

/**
 * Royalties actually distributed to a holder in a given period, grouped by song.
 * @param holder - Wallet address.
 * @query days - Period window (default 30).
 * @returns { periodDays, items: [{ songId, earned }], totalEarned }
 */
portfolio.get("/portfolio/earnings/:holder", async (c) => {
  const holder = c.req.param("holder").toLowerCase();
  const days = parseInt(c.req.query("days") || "30");
  const sinceTimestamp = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

  const rows = await db
    .select({
      songId: schema.royaltyDistributions.songId,
      earned: sql<string>`cast(sum(${schema.royaltyDistributions.amount}) as text)`,
    })
    .from(schema.royaltyDistributions)
    .where(
      and(
        eq(schema.royaltyDistributions.holder, holder as `0x${string}`),
        gte(schema.royaltyDistributions.blockTimestamp, sinceTimestamp),
      )
    )
    .groupBy(schema.royaltyDistributions.songId);

  const totalEarned = rows.reduce((sum, r) => sum + BigInt(r.earned), 0n).toString();

  return c.json({
    periodDays: days,
    items: rows.map(r => ({ songId: r.songId.toString(), earned: r.earned })),
    totalEarned,
  });
});

export default portfolio;
