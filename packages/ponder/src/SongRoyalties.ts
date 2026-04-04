import { ponder } from "ponder:registry";
import { songPlays, songPurchases } from "ponder:schema";

ponder.on("SongsModel:SongPlayed", async ({ event, context }) => {
  await context.db.insert(songPlays).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    songId: event.args.songId,
    listener: event.args.listener,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});

ponder.on("SongsModel:SongPurchase", async ({ event, context }) => {
  await context.db.insert(songPurchases).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    songId: event.args.songId,
    buyer: event.args.buyer,
    parts: event.args.parts,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});
