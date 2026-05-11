import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { count, desc, eq, inArray, sql } from "drizzle-orm";

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

/**
 * Aggregated portfolio positions for a buyer, based on purchase events.
 * @param buyer - Wallet address.
 * @returns { items: [{ songId, boughtParts, plays, firstPurchaseTimestamp, lastPurchaseTimestamp }] }
 */
portfolio.get("/portfolio/positions/:buyer", async (c) => {
  const buyer = c.req.param("buyer").toLowerCase();

  const aggregated = await db
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

  if (aggregated.length === 0) return c.json({ items: [] });

  const songIds = aggregated.map(p => p.songId);
  const playsRows = await db
    .select({ songId: schema.songPlays.songId, plays: count() })
    .from(schema.songPlays)
    .where(inArray(schema.songPlays.songId, songIds))
    .groupBy(schema.songPlays.songId);

  const playsBySongId = new Map(playsRows.map(row => [row.songId.toString(), row.plays]));

  return c.json({
    items: aggregated.map(p => ({
      songId: p.songId.toString(),
      boughtParts: String(p.boughtParts),
      plays: playsBySongId.get(p.songId.toString()) ?? 0,
      firstPurchaseTimestamp: Number(p.firstPurchaseTimestamp),
      lastPurchaseTimestamp: Number(p.lastPurchaseTimestamp),
    })),
  });
});

export default portfolio;
