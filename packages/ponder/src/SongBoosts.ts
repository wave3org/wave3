import { ponder } from "ponder:registry";
import { songBoosts } from "ponder:schema";

ponder.on("SongsModel:SongBoosted", async ({ event, context }) => {
  await context.db.insert(songBoosts).values({
    id: `${event.args.songId}-${event.transaction.hash}`,
    songId: event.args.songId,
    payer: event.args.payer,
    expiresAt: event.args.expiresAt,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});
