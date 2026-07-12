import { count, desc, eq, sql } from "ponder";

export async function fetchMostPlayedSongs(db: any, tables: any, limit: number) {
  const rows = await db
    .select({
      songId: tables.songs.songId,
      plays: sql<number>`COALESCE(COUNT(${tables.songPlays.songId}), 0)`,
      name: tables.songs.name,
      audioCID: tables.songs.audioCID,
      albumName: tables.albums.name,
      artist: tables.albums.artist,
      imageCID: tables.albums.imageCID,
    })
    .from(tables.songs)
    .leftJoin(tables.songPlays, eq(tables.songs.songId, tables.songPlays.songId))
    .innerJoin(tables.albums, eq(tables.albums.albumId, tables.songs.albumId))
    .groupBy(
      tables.songs.songId,
      tables.songs.name,
      tables.songs.audioCID,
      tables.albums.name,
      tables.albums.artist,
      tables.albums.imageCID,
    )
    .orderBy(desc(sql<number>`COALESCE(COUNT(${tables.songPlays.songId}), 0)`))
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
