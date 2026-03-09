import { ponder } from "ponder:registry";
import { songPlays } from "ponder:schema";

ponder.on("SongRoyalties:SongPlayed", async ({ event, context }) => {
  await context.db.insert(songPlays).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    songId: event.args.songId,
    listener: event.args.listener,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});
