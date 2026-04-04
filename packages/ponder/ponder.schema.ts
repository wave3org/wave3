import { onchainTable, relations, index } from "ponder";

export const albums = onchainTable(
  "albums",
  (t) => ({
    albumId: t.bigint().primaryKey(),
    name: t.text().notNull(),
    artist: t.hex().notNull(),
    imageCID: t.text().notNull(),
    genre: t.text().notNull(),
    year: t.bigint().notNull(),
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

export const songPlays = onchainTable(
  "song_plays",
  (t) => ({
    id: t.text().primaryKey(),
    songId: t.bigint().notNull(),
    listener: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.integer().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    songIdIdx: index("song_plays_song_id_idx").on(table.songId),
    listenerIdx: index("song_plays_listener_idx").on(table.listener),
  })
);

export const songPurchases = onchainTable(
  "song_purchases",
  (t) => ({
    id: t.text().primaryKey(),
    songId: t.bigint().notNull(),
    buyer: t.hex().notNull(),
    parts: t.bigint().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.integer().notNull(),
    transactionHash: t.hex().notNull(),
  }),
  (table) => ({
    songIdIdx: index("song_purchases_song_id_idx").on(table.songId),
    buyerIdx: index("song_purchases_buyer_idx").on(table.buyer),
  })
);

export const albumsRelations = relations(albums, ({ many }) => ({
  songs: many(songs),
}));

export const songsRelations = relations(songs, ({ one, many }) => ({
  album: one(albums, {
    fields: [songs.albumId],
    references: [albums.albumId],
  }),
  plays: many(songPlays),
  purchases: many(songPurchases),
}));

export const songPlaysRelations = relations(songPlays, ({ one }) => ({
  song: one(songs, {
    fields: [songPlays.songId],
    references: [songs.songId],
  }),
}));

export const songPurchasesRelations = relations(songPurchases, ({ one }) => ({
  song: one(songs, {
    fields: [songPurchases.songId],
    references: [songs.songId],
  }),
}));
