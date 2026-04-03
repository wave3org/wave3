import { ponder } from "ponder:registry";
import { songs } from "ponder:schema";

ponder.on("SongsModel:SongAdded", async ({ event, context }) => {
  await context.db.insert(songs).values({
    songId: event.args.id,
    albumId: event.args.albumId,
    name: event.args.name,
    audioCID: event.args.audioCID,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});
