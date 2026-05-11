import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { count, desc, inArray } from "drizzle-orm";

const marketplace = new Hono();

/**
 * Most played songs with album metadata for marketplace discovery.
 * @query limit - How many songs to return (default 12).
 * @returns { items: [{ songId, name, audioCID, album: { name, artist, imageCID }, plays }] }
 */
marketplace.get("/marketplace/most-played-songs", async (c) => {
  const limit = parseInt(c.req.query("limit") || "12");

  const playsRows = await db
    .select({ songId: schema.songPlays.songId, plays: count() })
    .from(schema.songPlays)
    .groupBy(schema.songPlays.songId)
    .orderBy(desc(count()))
    .limit(limit);

  if (playsRows.length === 0) return c.json({ items: [] });

  const songIds = playsRows.map(r => r.songId);
  const songs = await db.query.songs.findMany({
    columns: { songId: true, name: true, audioCID: true, albumId: true },
    with: {
      album: { columns: { name: true, artist: true, imageCID: true } },
    },
    where: inArray(schema.songs.songId, songIds),
  });

  const songById = new Map(songs.map(song => [song.songId.toString(), song]));

  const items = playsRows
    .map(r => {
      const song = songById.get(r.songId.toString());
      if (!song || !song.album) return null;
      return {
        songId: song.songId.toString(),
        name: song.name,
        audioCID: song.audioCID,
        album: {
          name: song.album.name,
          artist: song.album.artist,
          imageCID: song.album.imageCID,
        },
        plays: r.plays,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return c.json({ items });
});

export default marketplace;
