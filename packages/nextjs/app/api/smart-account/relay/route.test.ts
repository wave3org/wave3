import { beforeEach, describe, expect, it, vi } from "vitest";

const writeContractMock = vi.fn();
const waitForReceiptMock = vi.fn();
const readContractMock = vi.fn();
const verifyTypedDataMock = vi.fn();

const FACTORY = "0x1000000000000000000000000000000000000001";
const WAVECOIN = "0x1000000000000000000000000000000000000002";
const SONG_ROYALTIES = "0x1000000000000000000000000000000000000003";
const SMART_ACCOUNT = "0x1000000000000000000000000000000000000004";
const SESSION_KEY = "0x1000000000000000000000000000000000000005";
const OWNER = "0x1000000000000000000000000000000000000006";
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

vi.mock("~~/contracts/deployedContracts", () => ({
	default: {
		31337: {
			Wave3SmartAccountFactory: { address: FACTORY },
			Wavecoin: { address: WAVECOIN },
			SongRoyalties: { address: SONG_ROYALTIES }
		}
	}
}));

vi.mock("viem", async () => {
	const actual = await vi.importActual<typeof import("viem")>("viem");

	return {
		...actual,
		verifyTypedData: verifyTypedDataMock,
		createPublicClient: vi.fn(() => ({
			waitForTransactionReceipt: waitForReceiptMock,
			readContract: readContractMock,
			estimateFeesPerGas: vi.fn().mockResolvedValue({
				maxFeePerGas: BigInt("100000000"),
				maxPriorityFeePerGas: BigInt("1000000")
			})
		})),
		createWalletClient: vi.fn(() => ({
			writeContract: writeContractMock
		}))
	};
});

describe("smart-account relay route", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();

		process.env.SMART_ACCOUNT_RELAYER_PRIVATE_KEY = `0x${"11".repeat(32)}`;
		process.env.SMART_ACCOUNT_RPC_URL_HARDHAT = "http://127.0.0.1:8545";
		process.env.NEXT_PUBLIC_SMART_ACCOUNT_FACTORY_ADDRESS = FACTORY;
		process.env.SMART_ACCOUNT_MAX_CREATE_PER_DAY = "3";
		process.env.SMART_ACCOUNT_MAX_EXECUTE_PER_DAY = "250";
		process.env.SMART_ACCOUNT_MAX_AUTHORIZE_SESSION_PER_DAY = "20";
		process.env.SMART_ACCOUNT_MAX_SESSION_EXECUTE_PER_DAY = "1500";
	});

	it("creates a smart account when owner signature is valid", async () => {
		verifyTypedDataMock.mockResolvedValueOnce(true);
		readContractMock.mockResolvedValueOnce(ZERO_ADDRESS).mockResolvedValueOnce(SMART_ACCOUNT);
		writeContractMock.mockResolvedValueOnce("0xabc");
		waitForReceiptMock.mockResolvedValueOnce({ status: "success" });

		const { POST } = await import("./route");
		const response = await POST({
			json: async () => ({
				action: "createAccount",
				chainId: 31337,
				owner: OWNER,
				deadline: `${Math.floor(Date.now() / 1000) + 600}`,
				signature: "0x1234"
			})
		} as any);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.txHash).toBe("0xabc");
		expect(body.smartAccount).toBe(SMART_ACCOUNT);
		expect(verifyTypedDataMock).toHaveBeenCalledTimes(1);
		expect(writeContractMock).toHaveBeenCalledTimes(1);
	});

	it("rejects createAccount when owner signature is invalid", async () => {
		verifyTypedDataMock.mockResolvedValueOnce(false);

		const { POST } = await import("./route");
		const response = await POST({
			json: async () => ({
				action: "createAccount",
				chainId: 31337,
				owner: OWNER,
				deadline: `${Math.floor(Date.now() / 1000) + 600}`,
				signature: "0x1234"
			})
		} as any);

		expect(response.status).toBe(401);
		const body = await response.json();
		expect(body.error).toContain("Invalid create account signature");
		expect(writeContractMock).toHaveBeenCalledTimes(0);
	});

	it("rejects execute when selector is not allowlisted for target", async () => {
		const { POST } = await import("./route");
		const response = await POST({
			json: async () => ({
				action: "execute",
				chainId: 31337,
				smartAccount: SMART_ACCOUNT,
				target: WAVECOIN,
				data: "0x23b872dd",
				value: "0",
				deadline: `${Math.floor(Date.now() / 1000) + 600}`,
				signature: "0x1234"
			})
		} as any);

		expect(response.status).toBe(403);
		const body = await response.json();
		expect(body.error).toContain("Target function is not allowed");
	});

	it("enforces execute daily sponsorship quota", async () => {
		process.env.SMART_ACCOUNT_MAX_EXECUTE_PER_DAY = "1";
		readContractMock.mockResolvedValue(OWNER);
		writeContractMock.mockResolvedValue("0xdef");

		const payload = {
			action: "execute",
			chainId: 31337,
			smartAccount: SMART_ACCOUNT,
			target: WAVECOIN,
			data: "0x095ea7b3",
			value: "0",
			deadline: `${Math.floor(Date.now() / 1000) + 600}`,
			signature: "0x1234"
		};

		const { POST } = await import("./route");
		const first = await POST({ json: async () => payload } as any);
		expect(first.status).toBe(200);

		const second = await POST({ json: async () => payload } as any);
		expect(second.status).toBe(429);
		const body = await second.json();
		expect(body.error).toContain("Daily execute sponsorship quota exceeded");
	});

	it("executes session relay when payload is valid", async () => {
		readContractMock.mockResolvedValueOnce(OWNER);
		writeContractMock.mockResolvedValueOnce("0xfeed");

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
				signature: "0x1234"
			})
		} as any);

		expect(response.status).toBe(200);
		const body = await response.json();
		expect(body.txHash).toBe("0xfeed");
		expect(writeContractMock).toHaveBeenCalledTimes(1);
	});
});
