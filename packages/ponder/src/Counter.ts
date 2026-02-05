import { ponder } from "ponder:registry";
import { transferEvent } from "ponder:schema";

ponder.on("Wavecoin:Transfer", async ({ event, context }) => {
  // Index Wavecoin transfer events
  await context.db.insert(transferEvent).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    from: event.args.from,
    to: event.args.to,
    value: event.args.value,
    timestamp: Number(event.block.timestamp),
    blockNumber: event.block.number,
    transactionHash: event.transaction.hash,
  });
});
