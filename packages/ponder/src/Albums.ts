import { ponder } from "ponder:registry";
import { albums } from "ponder:schema";

ponder.on("Albums:AddedAlbum", async ({ event, context }) => {
  await context.db.insert(albums).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    albumId: event.args.id,
    name: event.args.name,
    artist: event.args.artist,
    imageCID: event.args.imageCID,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});
