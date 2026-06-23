import { count, desc, eq } from "drizzle-orm";

export async function fetchMostPlayedSongs(db: any, tables: any, limit: number) {
  const rows = await db
    .select({
      songId: tables.songPlays.songId,
      plays: count(),
      name: tables.songs.name,
      audioCID: tables.songs.audioCID,
      albumName: tables.albums.name,
      artist: tables.albums.artist,
      imageCID: tables.albums.imageCID,
    })
    .from(tables.songPlays)
    .innerJoin(tables.songs, eq(tables.songs.songId, tables.songPlays.songId))
    .innerJoin(tables.albums, eq(tables.albums.albumId, tables.songs.albumId))
    .groupBy(
      tables.songPlays.songId,
      tables.songs.name,
      tables.songs.audioCID,
      tables.albums.name,
      tables.albums.artist,
      tables.albums.imageCID,
    )
    .orderBy(desc(count()))
    .limit(limit);

  return rows.map((r: any) => ({
    songId: r.songId.toString(),
    name: r.name,
    audioCID: r.audioCID,
    album: {
      name: r.albumName,
      artist: r.artist,
      imageCID: r.imageCID,
    },
    plays: r.plays,
  }));
}
