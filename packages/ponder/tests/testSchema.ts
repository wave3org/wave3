/**
 * Plain drizzle pgTable definitions mirroring the ponder schema.
 * Used only in tests — ponder uses onchainTable at runtime.
 */
import { bigint, integer, pgTable, text } from "drizzle-orm/pg-core";

export const songShareBalances = pgTable("song_share_balances", {
  id: text("id").primaryKey(),
  songId: bigint("song_id", { mode: "bigint" }).notNull(),
  holder: text("holder").notNull(),
  parts: bigint("parts", { mode: "bigint" }).notNull(),
  firstAcquiredTimestamp: integer("first_acquired_timestamp").notNull(),
  lastTransferTimestamp: integer("last_transfer_timestamp").notNull(),
  lastTransactionHash: text("last_transaction_hash").notNull(),
});

export const songPlays = pgTable("song_plays", {
  id: text("id").primaryKey(),
  songId: bigint("song_id", { mode: "bigint" }).notNull(),
  listener: text("listener").notNull(),
  blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
  blockTimestamp: integer("block_timestamp").notNull(),
  transactionHash: text("transaction_hash").notNull(),
});

export const royaltyDistributions = pgTable("royalty_distributions", {
  id: text("id").primaryKey(),
  songId: bigint("song_id", { mode: "bigint" }).notNull(),
  holder: text("holder").notNull(),
  amount: bigint("amount", { mode: "bigint" }).notNull(),
  blockNumber: bigint("block_number", { mode: "bigint" }).notNull(),
  blockTimestamp: integer("block_timestamp").notNull(),
  transactionHash: text("transaction_hash").notNull(),
});
