import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import {
  fetchCurrentPositions,
  fetchEarningsByHolder,
  fetchPeriodPlaysBySongId,
  fetchSongPurchases,
  fetchTotalPlaysBySongId,
} from "../queries/portfolioQueries";

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
  const items = await fetchSongPurchases(db, schema, buyer?.toLowerCase(), limit);
  return c.json({ items });
});

type CurrentPosition = {
  songId: bigint;
  boughtParts: bigint;
  firstPurchaseTimestamp: number;
  lastPurchaseTimestamp: number;
};

/**
 * Current portfolio positions for a holder, based on ERC-1155 share balances.
 * @param buyer - Wallet address.
 * @query days - Period for playsInPeriod (default 30).
 * @returns { items: [{ songId, boughtParts, plays, playsInPeriod, periodDays, firstPurchaseTimestamp, lastPurchaseTimestamp }] }
 */
portfolio.get("/portfolio/positions/:buyer", async (c) => {
  const buyer = c.req.param("buyer").toLowerCase();
  const days = parseInt(c.req.query("days") || "30");
  const sinceTimestamp = Math.floor(Date.now() / 1000) - days * 24 * 60 * 60;

  const positions = await fetchCurrentPositions(db, schema, buyer);
  if (positions.length === 0) return c.json({ items: [] });

  const songIds = positions.map(p => p.songId);
  const [totalPlaysBySongId, periodPlaysBySongId] = await Promise.all([
    fetchTotalPlaysBySongId(db, schema, songIds),
    fetchPeriodPlaysBySongId(db, schema, positions, sinceTimestamp),
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

  const rows = await fetchEarningsByHolder(db, schema, holder, sinceTimestamp);
  const totalEarned = rows.reduce((sum, r) => sum + BigInt(r.earned), 0n).toString();

  return c.json({
    periodDays: days,
    items: rows.map(r => ({ songId: r.songId.toString(), earned: r.earned })),
    totalEarned,
  });
});

export default portfolio;

