import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { and, desc, gt, inArray } from "ponder";

const boosts = new Hono();

/**
 * Returns which of the given song IDs have an active boost (expiresAt > now).
 * @query ids - Comma-separated song IDs to check (e.g. "1,2,3").
 * @returns { items: [{ songId, expiresAt }] }
 */
boosts.get("/boosted-songs", async (c) => {
  const idsParam = c.req.query("ids");
  if (!idsParam) return c.json({ items: [] });

  const ids = idsParam.split(",").map(id => BigInt(id.trim()));
  const nowSecs = BigInt(Math.floor(Date.now() / 1000));

  const rows = await db
    .selectDistinctOn([schema.songBoosts.songId], {
      songId: schema.songBoosts.songId,
      expiresAt: schema.songBoosts.expiresAt,
    })
    .from(schema.songBoosts)
    .where(and(
      inArray(schema.songBoosts.songId, ids),
      gt(schema.songBoosts.expiresAt, nowSecs),
    ))
    .orderBy(schema.songBoosts.songId, desc(schema.songBoosts.expiresAt));

  return c.json({
    items: rows.map(r => ({
      songId: r.songId.toString(),
      expiresAt: r.expiresAt.toString(),
    })),
  });
});

export default boosts;
