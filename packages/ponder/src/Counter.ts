import { ponder } from "ponder:registry";
import { counterEvent } from "ponder:schema";

ponder.on("Counter:Incremented", async ({ event, context }) => {
    // Index the counter increment event
    await context.db.insert(counterEvent).values({
        id: `${event.transaction.hash}-${event.log.logIndex}`,
        value: event.args.newValue,
        timestamp: Number(event.block.timestamp),
        blockNumber: event.block.number,
        transactionHash: event.transaction.hash,
    });
});
