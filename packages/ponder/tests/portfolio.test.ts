import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import {
  fetchCurrentPositions,
  fetchEarningsByHolder,
  fetchPeriodPlaysBySongId,
  fetchTotalPlaysBySongId,
} from "../src/api/routes/portfolioQueries";
import * as testSchema from "./testSchema";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

// ─── tests ────────────────────────────────────────────────────────────────────

describe("portfolio queries", () => {
  let db: ReturnType<typeof drizzle<typeof testSchema>>;
  let client: PGlite;

  beforeEach(async () => {
    client = new PGlite();
    db = drizzle(client, { schema: testSchema });
    await setupTables(client);
  });

  // ── positions ──────────────────────────────────────────────────────────────

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

  // ── plays totales ──────────────────────────────────────────────────────────

  it("cuenta todos los plays all-time de una canción", async () => {
    await db.insert(testSchema.songPlays).values([
      { id: "p1", songId: SONG_ID, listener: "0xother", blockNumber: 1n, blockTimestamp: NOW - 300, transactionHash: "0x001" },
      { id: "p2", songId: SONG_ID, listener: "0xother", blockNumber: 2n, blockTimestamp: NOW - 200, transactionHash: "0x002" },
      { id: "p3", songId: SONG_ID, listener: "0xother", blockNumber: 3n, blockTimestamp: NOW - 100, transactionHash: "0x003" },
    ]);

    const map = await fetchTotalPlaysBySongId(db, testSchema, [SONG_ID]);
    expect(map.get("1")).toBe(3);
  });

  // ── plays del período ──────────────────────────────────────────────────────

  it("playsInPeriod solo cuenta plays DESPUÉS de que el usuario compró", async () => {
    const buyTimestamp = NOW - 5 * 24 * 60 * 60; // compró hace 5 días

    const positions = [
      {
        songId: SONG_ID,
        boughtParts: 10n,
        firstPurchaseTimestamp: buyTimestamp,
        lastPurchaseTimestamp: buyTimestamp,
      },
    ];

    await db.insert(testSchema.songPlays).values([
      // 2 plays ANTES de la compra → no deben contar
      { id: "old-1", songId: SONG_ID, listener: "0xother", blockNumber: 1n, blockTimestamp: buyTimestamp - 1000, transactionHash: "0xold1" },
      { id: "old-2", songId: SONG_ID, listener: "0xother", blockNumber: 2n, blockTimestamp: buyTimestamp - 500, transactionHash: "0xold2" },
      // 3 plays DESPUÉS de la compra → deben contar
      { id: "new-1", songId: SONG_ID, listener: "0xother", blockNumber: 3n, blockTimestamp: buyTimestamp + 100, transactionHash: "0xnew1" },
      { id: "new-2", songId: SONG_ID, listener: "0xother", blockNumber: 4n, blockTimestamp: buyTimestamp + 200, transactionHash: "0xnew2" },
      { id: "new-3", songId: SONG_ID, listener: "0xother", blockNumber: 5n, blockTimestamp: buyTimestamp + 300, transactionHash: "0xnew3" },
    ]);

    const map = await fetchPeriodPlaysBySongId(db, testSchema, positions, THIRTY_DAYS_AGO);
    expect(map.get("1")).toBe(3);
  });

  // ── ganancias / royalties ──────────────────────────────────────────────────

  it("holder con 10% recibe 3 × 0.1 WAVE por 3 plays", async () => {
    // playFee = 1 WAVE (1e18 wei), 10 partes de 100 totales = 10%
    const playFeeWei = 1_000_000_000_000_000_000n; // 1e18
    const holderShare = playFeeWei / 10n; // 0.1e18

    await db.insert(testSchema.royaltyDistributions).values([
      { id: "rd-1", songId: SONG_ID, holder: USER, amount: holderShare, blockNumber: 1n, blockTimestamp: NOW - 300, transactionHash: "0x001" },
      { id: "rd-2", songId: SONG_ID, holder: USER, amount: holderShare, blockNumber: 2n, blockTimestamp: NOW - 200, transactionHash: "0x002" },
      { id: "rd-3", songId: SONG_ID, holder: USER, amount: holderShare, blockNumber: 3n, blockTimestamp: NOW - 100, transactionHash: "0x003" },
    ]);

    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);

    expect(rows).toHaveLength(1);
    expect(BigInt(rows[0]!.earned)).toBe(holderShare * 3n); // 0.3 WAVE
  });

  it("no incluye royalties fuera del período (más de 30 días)", async () => {
    const oldTimestamp = THIRTY_DAYS_AGO - 1000; // un poco antes del período
    const holderShare = 100_000_000_000_000_000n; // 0.1 WAVE

    await db.insert(testSchema.royaltyDistributions).values([
      { id: "rd-old", songId: SONG_ID, holder: USER, amount: holderShare, blockNumber: 1n, blockTimestamp: oldTimestamp, transactionHash: "0x001" },
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
      { id: "b-1", songId: SONG_2, holder: USER, amount: shareB, blockNumber: 3n, blockTimestamp: NOW - 100, transactionHash: "0x003" },
    ]);

    const rows = await fetchEarningsByHolder(db, testSchema, USER, THIRTY_DAYS_AGO);
    const byId = new Map(rows.map(r => [r.songId.toString(), BigInt(r.earned)]));

    expect(byId.get("1")).toBe(shareA * 2n);
    expect(byId.get("2")).toBe(shareB);
  });
});
