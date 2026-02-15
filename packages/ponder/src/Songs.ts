import { ponder } from "ponder:registry";
import { songs } from "ponder:schema";

ponder.on("Songs:AddedSong", async ({ event, context }) => {
  // Index AddedSong events from the Songs contract
  await context.db.insert(songs).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    songId: event.args.id,
    albumId: event.args.albumId,
    name: event.args.name,
    audioCID: event.args.audioCID,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});
