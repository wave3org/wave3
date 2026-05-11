import { db } from "ponder:api";
import schema from "ponder:schema";
import { Hono } from "hono";
import { and, desc, eq, gt, inArray, or, sql, count } from "drizzle-orm";

const songs = new Hono();

/**
 * List songs with their album metadata, ordered by newest first.
 * @query name - Fuzzy search by song name (pg_trgm, threshold 0.1). Omit for all songs.
 * @query by - Comma-separated fields to search in: SONG, ALBUM, ARTIST, GENRE (default: all).
 * @query limit - Max results (default 100).
 * @returns { items: [{ songId, name, audioCID, album: { name, artist, imageCID } }] }
 */
songs.get("/songs-with-albums", async (c) => {
  const nameContains = c.req.query("name");
  const byParam = c.req.query("by");
  const limit = parseInt(c.req.query("limit") || "100");

  if (!nameContains) {
    const rows = await db.query.songs.findMany({
      columns: { songId: true, name: true, audioCID: true },
      with: {
        album: { columns: { name: true, artistName: true, imageCID: true } },
      },
      orderBy: [desc(schema.songs.blockTimestamp)],
      limit,
    });

    return c.json({
      items: rows.map(song => ({
        songId: song.songId.toString(),
        name: song.name,
        audioCID: song.audioCID,
        album: {
          name: song.album.name,
          artist: song.album.artistName,
          imageCID: song.album.imageCID,
        },
      })),
    });
  }

  const searchBy = byParam ? byParam.split(",").map(s => s.trim()).filter(Boolean) : [];
  const searchAll = searchBy.length === 0;
  const searchSong   = searchAll || searchBy.includes("SONG");
  const searchAlbum  = searchAll || searchBy.includes("ALBUM");
  const searchArtist = searchAll || searchBy.includes("ARTIST");
  const searchGenre  = searchAll || searchBy.includes("GENRE");

  const simSong   = sql<number>`public.similarity(${schema.songs.name}, ${nameContains})`;
  const simAlbum  = sql<number>`public.similarity(${schema.albums.name}, ${nameContains})`;
  const simArtist = sql<number>`public.similarity(${schema.albums.artistName}, ${nameContains})`;
  const simGenre  = sql<number>`public.similarity(${schema.albums.genre}, ${nameContains})`;

  const whereConditions = [
    ...(searchSong   ? [gt(simSong,   0.1)] : []),
    ...(searchAlbum  ? [gt(simAlbum,  0.1)] : []),
    ...(searchArtist ? [gt(simArtist, 0.1)] : []),
    ...(searchGenre  ? [gt(simGenre,  0.1)] : []),
  ];

  const scoreExpr = sql<number>`GREATEST(
    ${searchSong   ? simSong   : sql`0`},
    ${searchAlbum  ? simAlbum  : sql`0`},
    ${searchArtist ? simArtist : sql`0`},
    ${searchGenre  ? simGenre  : sql`0`}
  )`;

  const rows = await db
    .select({
      songId:     schema.songs.songId,
      name:       schema.songs.name,
      audioCID:   schema.songs.audioCID,
      albumName:  schema.albums.name,
      artistName: schema.albums.artistName,
      imageCID:   schema.albums.imageCID,
      score:      scoreExpr,
    })
    .from(schema.songs)
    .innerJoin(schema.albums, eq(schema.songs.albumId, schema.albums.albumId))
    .where(or(...whereConditions))
    .orderBy(desc(scoreExpr))
    .limit(limit);

  return c.json({
    items: rows.map(r => ({
      songId:   (r.songId as bigint).toString(),
      name:     r.name as string,
      audioCID: r.audioCID as string,
      album: {
        name:     r.albumName as string,
        artist:   r.artistName as string,
        imageCID: r.imageCID as string,
      },
    })),
  });
});

/**
 * Get a single song by ID with its album.
 * @param songId - On-chain song ID.
 * @returns { item: { songId, name, audioCID, album: { name, artist, imageCID } } | null }
 */
songs.get("/songs/:songId", async (c) => {
  const songIdParam = c.req.param("songId");

  let songId: bigint;
  try {
    songId = BigInt(songIdParam);
  } catch {
    return c.json({ error: "Invalid songId" }, 400);
  }

  const song = await db.query.songs.findFirst({
    columns: { songId: true, name: true, audioCID: true },
    with: {
      album: { columns: { name: true, artist: true, imageCID: true } },
    },
    where: eq(schema.songs.songId, songId),
  });

  if (!song) return c.json({ item: null });

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
 * Top songs by play count, with fallback to newest songs if no plays exist.
 * Used as fallback recommendations for new users with no listening history.
 * @query limit - How many songs to return (default 5).
 * @returns { items: [{ songId, name, audioCID, album: { name, artist, imageCID }, plays }] }
 */
songs.get("/songs/top", async (c) => {
  const limit = parseInt(c.req.query("limit") || "5");

  const playsRows = await db
    .select({ songId: schema.songPlays.songId, plays: count() })
    .from(schema.songPlays)
    .groupBy(schema.songPlays.songId)
    .orderBy(desc(count()))
    .limit(limit);

  let songIds: bigint[];

  if (playsRows.length > 0) {
    songIds = playsRows.map(r => r.songId);
  } else {
    // No plays yet — fall back to newest songs
    const newest = await db.query.songs.findMany({
      columns: { songId: true },
      orderBy: [desc(schema.songs.blockTimestamp)],
      limit,
    });
    songIds = newest.map(s => s.songId);
  }

  if (songIds.length === 0) return c.json({ items: [] });

  const rows = await db.query.songs.findMany({
    columns: { songId: true, name: true, audioCID: true },
    with: {
      album: { columns: { name: true, artistName: true, imageCID: true } },
    },
    where: inArray(schema.songs.songId, songIds),
  });

  const playsMap = new Map(playsRows.map(r => [r.songId.toString(), r.plays]));
  const songById = new Map(rows.map(s => [s.songId.toString(), s]));

  const items = songIds
    .map(id => {
      const song = songById.get(id.toString());
      if (!song || !song.album) return null;
      return {
        songId: song.songId.toString(),
        name: song.name,
        audioCID: song.audioCID,
        album: {
          name: song.album.name,
          artist: song.album.artistName,
          imageCID: song.album.imageCID,
        },
        plays: playsMap.get(song.songId.toString()) ?? 0,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return c.json({ items });
});

export default songs;
