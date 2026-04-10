import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { graphql } from "ponder";
import { desc, eq, gt, inArray, sql, count } from "drizzle-orm";

const app = new Hono();

app.use("/*", cors());

app.use("/graphql", graphql({ db, schema }));

/** Health check. Returns { status, service, message }. */
app.get("/ping", (c) => {
  return c.json({ status: "ok", service: "ponder", message: "Service is awake" });
});

/**
 * List songs with their album metadata, ordered by newest first.
 * @query name - Fuzzy search by song name (pg_trgm, threshold 0.1). Omit for all songs.
 * @query limit - Max results (default 100).
 * @returns { items: [{ songId, name, audioCID, album: { name, artist, imageCID } }] }
 */
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

/**
 * Get a single song by ID with its album.
 * @param songId - On-chain song ID.
 * @returns { item: { songId, name, audioCID, album: { name, artist, imageCID } } | null }
 */
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

/**
 * List all albums, ordered by newest first.
 * @returns { items: [{ albumId, name, artist, imageCID }] }
 */
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

/**
 * List play events, ordered by newest first.
 * @query limit - Max results (default 10000).
 * @returns { items: [{ songId, listener }] }
 */
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

/**
 * Most played songs, ranked by total play count.
 * @query limit - How many songs to return (default 5).
 * @returns { items: [{ songId, plays }] }
 */
app.get("/trending", async (c) => {
  const limit = parseInt(c.req.query("limit") || "5");

  const rows = await db
    .select({
      songId: schema.songPlays.songId,
      plays: count(),
    })
    .from(schema.songPlays)
    .groupBy(schema.songPlays.songId)
    .orderBy(desc(count()))
    .limit(limit);

  return c.json({ items: rows.map(r => ({ songId: r.songId.toString(), plays: r.plays })) });
});

/**
 * Most played songs with album metadata for marketplace discovery.
 * @query limit - How many songs to return (default 12).
 * @returns { items: [{ songId, name, audioCID, album: { name, artist, imageCID }, plays }] }
 */
app.get("/marketplace/most-played-songs", async (c) => {
  const limit = parseInt(c.req.query("limit") || "12");

  const rows = await db
    .select({
      songId: schema.songPlays.songId,
      plays: count(),
    })
    .from(schema.songPlays)
    .groupBy(schema.songPlays.songId)
    .orderBy(desc(count()))
    .limit(limit);

  if (rows.length === 0) {
    return c.json({ items: [] });
  }

  const songIds = rows.map(r => r.songId);
  const songs = await db.query.songs.findMany({
    columns: {
      songId: true,
      name: true,
      audioCID: true,
      albumId: true,
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
    where: inArray(schema.songs.songId, songIds),
  });

  const songById = new Map(songs.map(song => [song.songId.toString(), song]));
  const items = rows
    .map(r => {
      const song = songById.get(r.songId.toString());
      if (!song || !song.album) {
        return null;
      }

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

/**
 * List part purchase events, ordered by newest first.
 * @query buyer - Filter by buyer address (optional).
 * @query limit - Max results (default 10000).
 * @returns { items: [{ songId, buyer, parts, blockTimestamp }] }
 */
app.get("/song-purchases", async (c) => {
  const buyer = c.req.query("buyer");
  const limit = parseInt(c.req.query("limit") || "10000");

  const whereClause = buyer
    ? eq(schema.songPurchases.buyer, buyer.toLowerCase() as `0x${string}`)
    : undefined;

  const purchases = await db.query.songPurchases.findMany({
    columns: {
      songId: true,
      buyer: true,
      parts: true,
      blockTimestamp: true,
    },
    where: whereClause,
    orderBy: [desc(schema.songPurchases.blockTimestamp)],
    limit: limit,
  });

  const serializedPurchases = purchases.map(p => ({
    songId: p.songId.toString(),
    buyer: p.buyer,
    parts: p.parts.toString(),
    blockTimestamp: p.blockTimestamp,
  }));

  return c.json({ items: serializedPurchases });
});

/**
 * Training data for the ML recommendation system.
 * Returns play events with each song's genre and year already joined.
 * @returns { items: [{ songId, listener, genre, year }] }
 */
app.get("/training-data", async (c) => {
  const plays = await db.query.songPlays.findMany({
    columns: { songId: true, listener: true },
    with: {
      song: {
        columns: {},
        with: {
          album: {
            columns: { genre: true, year: true },
          },
        },
      },
    },
  });

  const items = plays.map(play => ({
    songId: play.songId.toString(),
    listener: play.listener,
    genre: play.song?.album?.genre ?? "",
    year: Number(play.song?.album?.year ?? 0),
  }));

  return c.json({ items });
});

export default app;
