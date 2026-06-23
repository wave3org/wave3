import { count, desc, gte } from "ponder";

export async function fetchTrending(db: any, tables: any, limit: number) {
  const rows = await db
    .select({ songId: tables.songPlays.songId, plays: count() })
    .from(tables.songPlays)
    .groupBy(tables.songPlays.songId)
    .orderBy(desc(count()))
    .limit(limit);

  return rows.map((r: any) => ({ songId: r.songId.toString(), plays: r.plays }));
}

export async function fetchSongPlaysStats(db: any, tables: any, sinceTimestamp: number) {
  const rows = await db
    .select({ songId: tables.songPlays.songId, plays: count() })
    .from(tables.songPlays)
    .where(gte(tables.songPlays.blockTimestamp, sinceTimestamp))
    .groupBy(tables.songPlays.songId);

  return rows.map((r: any) => ({ songId: r.songId.toString(), plays: r.plays }));
}
