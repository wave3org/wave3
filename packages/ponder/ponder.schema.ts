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
