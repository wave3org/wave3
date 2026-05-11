import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { count, desc } from "drizzle-orm";

const plays = new Hono();

/**
 * List play events, ordered by newest first.
 * @query limit - Max results (default 10000).
 * @returns { items: [{ songId, listener }] }
 */
plays.get("/song-plays", async (c) => {
  const limit = parseInt(c.req.query("limit") || "10000");

  const rows = await db.query.songPlays.findMany({
    columns: { songId: true, listener: true },
    orderBy: [desc(schema.songPlays.blockTimestamp)],
    limit,
  });

  return c.json({
    items: rows.map(play => ({
      songId: play.songId.toString(),
      listener: play.listener,
    })),
  });
});

/**
 * Most played songs, ranked by total play count.
 * @query limit - How many songs to return (default 5).
 * @returns { items: [{ songId, plays }] }
 */
plays.get("/trending", async (c) => {
  const limit = parseInt(c.req.query("limit") || "5");

  const rows = await db
    .select({ songId: schema.songPlays.songId, plays: count() })
    .from(schema.songPlays)
    .groupBy(schema.songPlays.songId)
    .orderBy(desc(count()))
    .limit(limit);

  return c.json({
    items: rows.map(r => ({ songId: r.songId.toString(), plays: r.plays })),
  });
});

/**
 * Training data for the ML recommendation system.
 * Returns play events with each song's genre and year already joined.
 * @returns { items: [{ songId, listener, genre, year }] }
 */
plays.get("/training-data", async (c) => {
  const rows = await db.query.songPlays.findMany({
    columns: { songId: true, listener: true },
    with: {
      song: {
        columns: {},
        with: {
          album: { columns: { genre: true, year: true } },
        },
      },
    },
  });

  return c.json({
    items: rows.map(play => ({
      songId: play.songId.toString(),
      listener: play.listener,
      genre: play.song?.album?.genre ?? "",
      year: Number(play.song?.album?.year ?? 0),
    })),
  });
});

export default plays;
