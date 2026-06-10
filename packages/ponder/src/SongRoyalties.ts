import { ponder } from "ponder:registry";
import { royaltyDistributions, songPlays, songPurchases, songShareBalances } from "ponder:schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const balanceId = (songId: bigint, holder: string) => `${songId.toString()}-${holder.toLowerCase()}`;

const addParts = async ({
  context,
  songId,
  holder,
  parts,
  blockTimestamp,
  transactionHash,
}: {
  context: any;
  songId: bigint;
  holder: `0x${string}`;
  parts: bigint;
  blockTimestamp: number;
  transactionHash: `0x${string}`;
}) => {
  const normalizedHolder = holder.toLowerCase() as `0x${string}`;
  const id = balanceId(songId, normalizedHolder);
  const current = await context.db.find(songShareBalances, { id });

  if (!current) {
    await context.db.insert(songShareBalances).values({
      id,
      songId,
      holder: normalizedHolder,
      parts,
      firstAcquiredTimestamp: blockTimestamp,
      lastTransferTimestamp: blockTimestamp,
      lastTransactionHash: transactionHash,
    });
    return;
  }

  await context.db.update(songShareBalances, { id }).set({
    parts: current.parts + parts,
    lastTransferTimestamp: blockTimestamp,
    lastTransactionHash: transactionHash,
  });
};

const subtractParts = async ({
  context,
  songId,
  holder,
  parts,
  blockTimestamp,
  transactionHash,
}: {
  context: any;
  songId: bigint;
  holder: `0x${string}`;
  parts: bigint;
  blockTimestamp: number;
  transactionHash: `0x${string}`;
}) => {
  const normalizedHolder = holder.toLowerCase() as `0x${string}`;
  const id = balanceId(songId, normalizedHolder);
  const current = await context.db.find(songShareBalances, { id });

  if (!current) {
    await context.db.insert(songShareBalances).values({
      id,
      songId,
      holder: normalizedHolder,
      parts: 0n,
      firstAcquiredTimestamp: blockTimestamp,
      lastTransferTimestamp: blockTimestamp,
      lastTransactionHash: transactionHash,
    });
    return;
  }

  const nextParts = current.parts > parts ? current.parts - parts : 0n;
  await context.db.update(songShareBalances, { id }).set({
    parts: nextParts,
    lastTransferTimestamp: blockTimestamp,
    lastTransactionHash: transactionHash,
  });
};

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

ponder.on("SongRoyalties:SharesTransferred" as any, async ({ event, context }: any) => {
  const songId = event.args.songId;
  const parts = event.args.parts;
  const from = event.args.from.toLowerCase() as `0x${string}`;
  const to = event.args.to.toLowerCase() as `0x${string}`;
  const blockTimestamp = Number(event.block.timestamp);
  const transactionHash = event.transaction.hash;

  if (parts === 0n) {
    return;
  }

  if (from !== ZERO_ADDRESS) {
    await subtractParts({
      context,
      songId,
      holder: from,
      parts,
      blockTimestamp,
      transactionHash,
    });
  }

  if (to !== ZERO_ADDRESS) {
    await addParts({
      context,
      songId,
      holder: to,
      parts,
      blockTimestamp,
      transactionHash,
    });
  }
});

ponder.on("SongsModel:RoyaltyDistributed", async ({ event, context }) => {
  await context.db.insert(royaltyDistributions).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    songId: event.args.songId,
    holder: event.args.holder,
    amount: event.args.amount,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});

ponder.on("SongRoyalties:RoyaltiesClaimed" as any, async ({ event, context }: any) => {
  await context.db.insert(royaltyDistributions).values({
    id: `${event.transaction.hash}-${event.log.logIndex}`,
    songId: event.args.songId,
    holder: event.args.holder,
    amount: event.args.amount,
    blockNumber: event.block.number,
    blockTimestamp: Number(event.block.timestamp),
    transactionHash: event.transaction.hash,
  });
});
