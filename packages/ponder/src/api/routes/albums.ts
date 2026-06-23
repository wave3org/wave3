import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { desc } from "ponder";

const albums = new Hono();

/**
 * List all albums, ordered by newest first.
 * @returns { items: [{ albumId, name, artist, imageCID }] }
 */
albums.get("/albums", async (c) => {
  const rows = await db.query.albums.findMany({
    columns: { albumId: true, name: true, artist: true, imageCID: true },
    orderBy: [desc(schema.albums.blockTimestamp)],
  });

  return c.json({
    items: rows.map(album => ({
      albumId: album.albumId.toString(),
      name: album.name,
      artist: album.artist,
      imageCID: album.imageCID,
    })),
  });
});

export default albums;
