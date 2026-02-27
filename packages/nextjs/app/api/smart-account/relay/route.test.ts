import { beforeEach, describe, expect, it, vi } from "vitest";

const writeContractMock = vi.fn();
const waitForReceiptMock = vi.fn();
const readContractMock = vi.fn();

const FACTORY = "0x1000000000000000000000000000000000000001";
const WAVECOIN = "0x1000000000000000000000000000000000000002";
const SONG_ROYALTIES = "0x1000000000000000000000000000000000000003";
const SMART_ACCOUNT = "0x1000000000000000000000000000000000000004";
const SESSION_KEY = "0x1000000000000000000000000000000000000005";

vi.mock("~~/contracts/deployedContracts", () => ({
  default: {
    31337: {
      Wave3SmartAccountFactory: { address: FACTORY },
      Wavecoin: { address: WAVECOIN },
      SongRoyalties: { address: SONG_ROYALTIES },
    },
  },
}));

vi.mock("viem", async () => {
  const actual = await vi.importActual<typeof import("viem")>("viem");

  return {
    ...actual,
    createPublicClient: vi.fn(() => ({
      waitForTransactionReceipt: waitForReceiptMock,
      readContract: readContractMock,
    })),
    createWalletClient: vi.fn(() => ({
      writeContract: writeContractMock,
    })),
  };
});

describe("smart-account relay route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SMART_ACCOUNT_RELAYER_PRIVATE_KEY = `0x${"11".repeat(32)}`;
    process.env.SMART_ACCOUNT_RPC_URL_HARDHAT = "http://127.0.0.1:8545";
    process.env.NEXT_PUBLIC_SMART_ACCOUNT_FACTORY_ADDRESS = FACTORY;
  });

  it("creates a smart account", async () => {
    writeContractMock.mockResolvedValueOnce("0xabc");
    waitForReceiptMock.mockResolvedValueOnce({ status: "success" });
    readContractMock.mockResolvedValueOnce(SMART_ACCOUNT);

    const { POST } = await import("./route");
    const response = await POST({
      json: async () => ({
        action: "createAccount",
        chainId: 31337,
        owner: "0x1000000000000000000000000000000000000006",
      }),
    } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.txHash).toBe("0xabc");
    expect(body.smartAccount).toBe(SMART_ACCOUNT);
    expect(writeContractMock).toHaveBeenCalledTimes(1);
  });

  it("rejects execute when target is not allowlisted", async () => {
    const { POST } = await import("./route");
    const response = await POST({
      json: async () => ({
        action: "execute",
        chainId: 31337,
        smartAccount: SMART_ACCOUNT,
        target: "0x1000000000000000000000000000000000000999",
        data: "0x1234",
        value: "0",
        deadline: `${Math.floor(Date.now() / 1000) + 600}`,
        signature: "0x1234",
      }),
    } as any);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("Target contract is not allowed");
  });

  it("rejects authorizeSessionKey for non-playSong selector", async () => {
    const { POST } = await import("./route");
    const response = await POST({
      json: async () => ({
        action: "authorizeSessionKey",
        chainId: 31337,
        smartAccount: SMART_ACCOUNT,
        sessionKey: SESSION_KEY,
        target: SONG_ROYALTIES,
        selector: "0xdeadbeef",
        validUntil: `${Math.floor(Date.now() / 1000) + 3600}`,
        maxCalls: 10,
        deadline: `${Math.floor(Date.now() / 1000) + 600}`,
        signature: "0x1234",
      }),
    } as any);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toContain("only be authorized for SongRoyalties.playSong");
  });

  it("executes session relay when payload is valid", async () => {
    writeContractMock.mockResolvedValueOnce("0xdef");

    const { POST } = await import("./route");
    const response = await POST({
      json: async () => ({
        action: "executeSession",
        chainId: 31337,
        smartAccount: SMART_ACCOUNT,
        sessionKey: SESSION_KEY,
        target: SONG_ROYALTIES,
        data: "0x759950e60000000000000000000000000000000000000000000000000000000000000001",
        value: "0",
        deadline: `${Math.floor(Date.now() / 1000) + 600}`,
        signature: "0x1234",
      }),
    } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.txHash).toBe("0xdef");
    expect(writeContractMock).toHaveBeenCalledTimes(1);
  });
});
