import { onchainTable, relations, index } from "ponder";

export const albums = onchainTable(
  "albums",
  (t) => ({
    albumId: t.bigint().primaryKey(),
    name: t.text().notNull(),
    artist: t.hex().notNull(),
    imageCID: t.text().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.integer().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    artistIdx: index("albums_artist_idx").on(table.artist),
    albumIdIdx: index("albums_album_id_idx").on(table.albumId),
  })
);

export const songs = onchainTable(
  "songs",
  (t) => ({
    songId: t.bigint().primaryKey(),
    albumId: t.bigint().notNull(),
    name: t.text().notNull(),
    audioCID: t.text().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.integer().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    nameIdx: index("songs_name_idx").on(table.name),
    albumIdIdx: index("songs_album_id_idx").on(table.albumId),
  })
);

export const albumsRelations = relations(albums, ({ many }) => ({
  songs: many(songs),
}));

export const songsRelations = relations(songs, ({ one }) => ({
  album: one(albums, {
    fields: [songs.albumId],
    references: [albums.albumId],
  }),
}));
