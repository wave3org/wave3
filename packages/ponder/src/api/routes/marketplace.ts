import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { fetchMostPlayedSongs } from "../queries/marketplaceQueries";

const marketplace = new Hono();

/**
 * Most played songs with album metadata for marketplace discovery.
 * @query limit - How many songs to return (default 12).
 * @returns { items: [{ songId, name, audioCID, album: { name, artist, imageCID }, plays }] }
 */
marketplace.get("/marketplace/most-played-songs", async (c) => {
  const limit = parseInt(c.req.query("limit") || "12");
  const items = await fetchMostPlayedSongs(db, schema, limit);
  return c.json({ items });
});

export default marketplace;
