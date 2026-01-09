import { onchainTable } from "ponder";

export const counterEvent = onchainTable("counter_event", (t) => ({
  id: t.text().primaryKey(),
  value: t.bigint().notNull(),
  timestamp: t.integer().notNull(),
  blockNumber: t.bigint().notNull(),
  transactionHash: t.hex().notNull(),
}));
