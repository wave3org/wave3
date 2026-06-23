import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import {
  fetchCurrentPositions,
  fetchEarningsByHolder,
  fetchPeriodPlaysBySongId,
  fetchTotalPlaysBySongId,
} from "../src/api/queries/portfolioQueries";
import * as testSchema from "./testSchema";

const USER = "0xuser000000000000000000000000000000000001";
const SONG_ID = 1n;
const NOW = Math.floor(Date.now() / 1000);
const THIRTY_DAYS_AGO = NOW - 30 * 24 * 60 * 60;

async function setupTables(client: PGlite) {
  await client.exec(`
    CREATE TABLE IF NOT EXISTS song_share_balances (
      id TEXT PRIMARY KEY,
      song_id BIGINT NOT NULL,
      holder TEXT NOT NULL,
      parts BIGINT NOT NULL,
      first_acquired_timestamp INTEGER NOT NULL,
      last_transfer_timestamp INTEGER NOT NULL,
      last_transaction_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS song_plays (
      id TEXT PRIMARY KEY,
      song_id BIGINT NOT NULL,
      listener TEXT NOT NULL,
      block_number BIGINT NOT NULL,
      block_timestamp INTEGER NOT NULL,
      transaction_hash TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS royalty_distributions (
      id TEXT PRIMARY KEY,
      song_id BIGINT NOT NULL,
      holder TEXT NOT NULL,
      amount BIGINT NOT NULL,
      block_number BIGINT NOT NULL,
      block_timestamp INTEGER NOT NULL,
      transaction_hash TEXT NOT NULL
    );
  `);
}

describe("portfolio queries", () => {
  let db: ReturnType<typeof drizzle<typeof testSchema>>;
  let client: PGlite;

  beforeEach(async () => {
    client = new PGlite();
    db = drizzle(client, { schema: testSchema });
    await setupTables(client);
  });

  it("devuelve posiciones de un holder", async () => {
    await db.insert(testSchema.songShareBalances).values({
      id: "pos-1",
      songId: SONG_ID,
      holder: USER,
      parts: 10n,
      firstAcquiredTimestamp: THIRTY_DAYS_AGO,
      lastTransferTimestamp: THIRTY_DAYS_AGO,
      lastTransactionHash: "0xabc",
    });

    const positions = await fetchCurrentPositions(db, testSchema, USER);

    expect(positions).toHaveLength(1);
    expect(positions[0]!.songId).toBe(SONG_ID);
    expect(positions[0]!.boughtParts).toBe(10n);
  });

  it("no devuelve posiciones con parts = 0 (vendió todo)", async () => {
    await db.insert(testSchema.songShareBalances).values({
      id: "pos-sold",
      songId: SONG_ID,
      holder: USER,
      parts: 0n,
      firstAcquiredTimestamp: THIRTY_DAYS_AGO,
      lastTransferTimestamp: THIRTY_DAYS_AGO,
      lastTransactionHash: "0xabc",
    });

    const positions = await fetchCurrentPositions(db, testSchema, USER);
    expect(positions).toHaveLength(0);
  });

  it("cuenta todos los plays all-time de una canción", async () => {
    await db.insert(testSchema.songPlays).values([
      { id: "p1", songId: SONG_ID, listener: "0xother", blockNumber: 1n, blockTimestamp: NOW - 300, transactionHash: "0x001" },
      { id: "p2", songId: SONG_ID, listener: "0xother", blockNumber: 2n, blockTimestamp: NOW - 200, transactionHash: "0x002" },
      { id: "p3", songId: SONG_ID, listener: "0xother", blockNumber: 3n, blockTimestamp: NOW - 100, transactionHash: "0x003" },
    ]);

    const map = await fetchTotalPlaysBySongId(db, testSchema, [SONG_ID]);
    expect(map.get("1")).toBe(3);
  });

  it("playsInPeriod solo cuenta plays después de que el usuario compró", async () => {
    const buyTimestamp = NOW - 5 * 24 * 60 * 60;

    const positions = [{
      songId: SONG_ID,
      boughtParts: 10n,
      firstPurchaseTimestamp: buyTimestamp,
      lastPurchaseTimestamp: buyTimestamp,
    }];

    await db.insert(testSchema.songPlays).values([
      { id: "old-1", songId: SONG_ID, listener: "0xother", blockNumber: 1n, blockTimestamp: buyTimestamp - 1000, transactionHash: "0xold1" },
      { id: "old-2", songId: SONG_ID, listener: "0xother", blockNumber: 2n, blockTimestamp: buyTimestamp - 500,  transactionHash: "0xold2" },
      { id: "new-1", songId: SONG_ID, listener: "0xother", blockNumber: 3n, blockTimestamp: buyTimestamp + 100,  transactionHash: "0xnew1" },
      { id: "new-2", songId: SONG_ID, listener: "0xother", blockNumber: 4n, blockTimestamp: buyTimestamp + 200,  transactionHash: "0xnew2" },
      { id: "new-3", songId: SONG_ID, listener: "0xother", blockNumber: 5n, blockTimestamp: buyTimestamp + 300,  transactionHash: "0xnew3" },
    ]);

    const map = await fetchPeriodPlaysBySongId(db, testSchema, positions, THIRTY_DAYS_AGO);
    expect(map.get("1")).toBe(3);
  });

  it("holder con 10% recibe 3 × 0.1 WAVE por 3 plays", async () => {
    const playFeeWei = 1_000_000_000_000_000_000n;
    const holderShare = playFeeWei / 10n;

    await db.insert(testSchema.royaltyDistributions).values([
      { id: "rd-1", songId: SONG_ID, holder: USER, amount: holderShare, blockNumber: 1n, blockTimestamp: NOW - 300, transactionHash: "0x001" },
      { id: "rd-2", songId: SONG_ID, holder: USER, amount: holderShare, blockNumber: 2n, blockTimestamp: NOW - 200, transactionHash: "0x002" },
      { id: "rd-3", songId: SONG_ID, holder: USER, amount: holderShare, blockNumber: 3n, blockTimestamp: NOW - 100, transactionHash: "0x003" },
    ]);

    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);

    expect(rows).toHaveLength(1);
    expect(BigInt(rows[0]!.earned)).toBe(holderShare * 3n);
  });

  it("no incluye royalties fuera del período (más de 30 días)", async () => {
    await db.insert(testSchema.royaltyDistributions).values([
      { id: "rd-old", songId: SONG_ID, holder: USER, amount: 100_000_000_000_000_000n, blockNumber: 1n, blockTimestamp: THIRTY_DAYS_AGO - 1000, transactionHash: "0x001" },
    ]);

    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);
    expect(rows).toHaveLength(0);
  });

  it("agrupa ganancias por canción correctamente", async () => {
    const SONG_2 = 2n;
    const shareA = 100_000_000_000_000_000n;
    const shareB = 200_000_000_000_000_000n;

    await db.insert(testSchema.royaltyDistributions).values([
      { id: "a-1", songId: SONG_ID, holder: USER, amount: shareA, blockNumber: 1n, blockTimestamp: NOW - 100, transactionHash: "0x001" },
      { id: "a-2", songId: SONG_ID, holder: USER, amount: shareA, blockNumber: 2n, blockTimestamp: NOW - 200, transactionHash: "0x002" },
      { id: "b-1", songId: SONG_2,  holder: USER, amount: shareB, blockNumber: 3n, blockTimestamp: NOW - 100, transactionHash: "0x003" },
    ]);

    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);
    const byId = new Map(rows.map(r => [r.songId.toString(), BigInt(r.earned)]));

    expect(byId.get("1")).toBe(shareA * 2n);
    expect(byId.get("2")).toBe(shareB);
  });

  it("withdraw: 100 plays × 10% → earnings = accrued × 70% (fee 30%)", async () => {
    const playFee = 1_000_000_000_000_000_000n;
    const TOTAL_PARTS = 100n;
    const USER_PARTS = 10n;
    const PLAYS = 100n;
    const FEE_PERCENTAGE = 30n;

    const accrued = (playFee * PLAYS * USER_PARTS) / TOTAL_PARTS;
    const holderAmount = accrued - (accrued * FEE_PERCENTAGE) / 100n;

    await db.insert(testSchema.royaltyDistributions).values({
      id: "claim-1",
      songId: SONG_ID,
      holder: USER,
      amount: holderAmount,
      blockNumber: 1n,
      blockTimestamp: NOW - 100,
      transactionHash: "0xclaim1",
    });

    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);

    expect(rows).toHaveLength(1);
    expect(BigInt(rows[0]!.earned)).toBe(holderAmount);
  });

  it("antes del withdraw, earnings = 0", async () => {
    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);
    expect(rows).toHaveLength(0);
  });

  it("plays deberían generar earnings sin necesidad de withdraw", async () => {
    const playFee = 1_000_000_000_000_000_000n;
    const USER_PARTS = 10n;
    const TOTAL_PARTS = 100n;
    const perPlayAmount = (playFee * USER_PARTS) / TOTAL_PARTS;

    // Simula lo que ponder inserta al recibir RoyaltyDistributed por cada play
    // (ahora que el contrato emite el evento por play, no solo al hacer withdraw)
    await db.insert(testSchema.royaltyDistributions).values([
      { id: "play-1", songId: SONG_ID, holder: USER, amount: perPlayAmount, blockNumber: 1n, blockTimestamp: NOW - 300, transactionHash: "0x001" },
      { id: "play-2", songId: SONG_ID, holder: USER, amount: perPlayAmount, blockNumber: 2n, blockTimestamp: NOW - 200, transactionHash: "0x002" },
      { id: "play-3", songId: SONG_ID, holder: USER, amount: perPlayAmount, blockNumber: 3n, blockTimestamp: NOW - 100, transactionHash: "0x003" },
    ]);

    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);
    const total = rows.reduce((sum, r) => sum + BigInt(r.earned), 0n);

    expect(total).toBe(perPlayAmount * 3n);
  });

  it("dos withdraws en el período suman correctamente", async () => {
    const holderAmount1 = 7_000_000_000_000_000_000n;
    const holderAmount2 = 3_500_000_000_000_000_000n;

    await db.insert(testSchema.royaltyDistributions).values([
      { id: "claim-1", songId: SONG_ID, holder: USER, amount: holderAmount1, blockNumber: 1n, blockTimestamp: NOW - 200, transactionHash: "0xclaim1" },
      { id: "claim-2", songId: SONG_ID, holder: USER, amount: holderAmount2, blockNumber: 2n, blockTimestamp: NOW - 100, transactionHash: "0xclaim2" },
    ]);

    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);

    expect(rows).toHaveLength(1);
    expect(BigInt(rows[0]!.earned)).toBe(holderAmount1 + holderAmount2);
  });
});


