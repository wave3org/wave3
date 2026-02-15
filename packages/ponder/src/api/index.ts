import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { graphql } from "ponder";
import { desc, sql, gt, inArray } from "drizzle-orm";

const app = new Hono();

app.use("/*", cors());

app.use("/graphql", graphql({ db, schema }));

app.get("/ping", (c) => {
  return c.json({ status: "ok", service: "ponder", message: "Service is awake" });
});

app.get("/songs-with-albums", async (c) => {
  const nameContains = c.req.query("name");
  const limit = parseInt(c.req.query("limit") || "100");
  
  if (!nameContains) {
    const songs = await db.query.songs.findMany({
      columns: {
        name: true,
        audioCID: true,
      },
      with: {
        album: {
          columns: {
            name: true,
            artist: true,
            imageCID: true,
          },
        },
      },
      orderBy: [desc(schema.songs.blockTimestamp)],
      limit: limit,
    });
    
    return c.json({ items: songs });
  }

  const similarityScore = sql<number>`similarity(${schema.songs.name}, ${nameContains})`;
  
  const songs = await db
    .select({
      name: schema.songs.name,
      audioCID: schema.songs.audioCID,
      albumId: schema.songs.albumId,
      similarity: similarityScore,
    })
    .from(schema.songs)
    .where(gt(similarityScore, 0.1))
    .orderBy(desc(similarityScore))
    .limit(limit);

  const albumIds = [...new Set(songs.map(s => s.albumId))];
  
  const albums = await db
    .select({
      albumId: schema.albums.albumId,
      name: schema.albums.name,
      artist: schema.albums.artist,
      imageCID: schema.albums.imageCID,
    })
    .from(schema.albums)
    .where(inArray(schema.albums.albumId, albumIds));

  const songsWithAlbums = songs.map(song => {
    const album = albums.find(a => a.albumId === song.albumId)!;
    return {
      name: song.name,
      audioCID: song.audioCID,
      album: {
        name: album.name,
        artist: album.artist,
        imageCID: album.imageCID,
      },
    };
  });
  
  return c.json({ items: songsWithAlbums });
});

app.get("/albums", async (c) => {
  const albums = await db.query.albums.findMany({
    columns: {
      albumId: true,
      name: true,
      artist: true,
      imageCID: true,
    },
    orderBy: [desc(schema.albums.blockTimestamp)],
  });
  
  const serializedAlbums = albums.map(album => ({
    albumId: album.albumId.toString(),
    name: album.name,
    artist: album.artist,
    imageCID: album.imageCID,
  }));
  
  return c.json({ items: serializedAlbums });
});

export default app;
