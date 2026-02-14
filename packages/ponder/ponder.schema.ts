import { onchainTable } from "ponder";

export const transferEvent = onchainTable("transfer_event", (t) => ({
  id: t.text().primaryKey(),
  from: t.hex().notNull(),
  to: t.hex().notNull(),
  value: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));
export const songs = onchainTable("songs", (t) => ({
  id: t.text().primaryKey(),
  songId: t.bigint().notNull(),
  name: t.text().notNull(),
  audioCID: t.text().notNull(),
  blockNumber: t.bigint().notNull(),
  blockTimestamp: t.integer().notNull(),
  transactionHash: t.hex().notNull(),
}));