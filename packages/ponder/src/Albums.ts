import { ponder } from "ponder:registry";
import { albums } from "ponder:schema";

ponder.on("SongsModel:AlbumAdded", async ({ event, context }) => {
  await context.db.insert(albums).values({
    albumId: event.args.id,
    name: event.args.name,
    artist: event.args.owner,
    imageCID: event.args.imageCID,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});
