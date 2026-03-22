import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { graphql } from "ponder";
import { desc, eq, gt, inArray, sql } from "drizzle-orm";

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
        songId: true,
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
    
    const serializedSongs = songs.map(song => ({
      songId: song.songId.toString(),
      name: song.name,
      audioCID: song.audioCID,
      album: song.album,
    }));
    
    return c.json({ items: serializedSongs });
  }

  const similarityScore = sql<number>`public.similarity(${schema.songs.name}, ${nameContains})`;
  
  const songs = await db
    .select({
      songId: schema.songs.songId,
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
      songId: song.songId.toString(),
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

app.get("/songs/:songId", async (c) => {
  const songIdParam = c.req.param("songId");

  let songId: bigint;
  try {
    songId = BigInt(songIdParam);
  } catch {
    return c.json({ error: "Invalid songId" }, 400);
  }

  const song = await db.query.songs.findFirst({
    columns: {
      songId: true,
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
    where: eq(schema.songs.songId, songId),
  });

  if (!song) {
    return c.json({ item: null });
  }

  return c.json({
    item: {
      songId: song.songId.toString(),
      name: song.name,
      audioCID: song.audioCID,
      album: song.album,
    },
  });
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

app.get("/song-plays", async (c) => {
  const limit = parseInt(c.req.query("limit") || "10000");
  
  const plays = await db.query.songPlays.findMany({
    columns: {
      songId: true,
      listener: true,
    },
    orderBy: [desc(schema.songPlays.blockTimestamp)],
    limit: limit,
  });
  
  const serializedPlays = plays.map(play => ({
    songId: play.songId.toString(),
    listener: play.listener,
  }));
  
  return c.json({ items: serializedPlays });
});

export default app;
