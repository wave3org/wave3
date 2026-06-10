import { expect } from "chai";
import { ethers } from "hardhat";

describe("Wave3SmartAccount", function () {
	let wavecoin: any;
	let songsModel: any;
	let songsFactory: any;
	let songRoyalties: any;
	let factory: any;
	let smartAccount: any;
	let owner: any;
	let relayer: any;
	let sessionWallet: any;

	const blockTimestamp = async () => {
		const block = await ethers.provider.getBlock("latest");
		return BigInt(block!.timestamp);
	};

	const getDomain = async () => ({
		name: "Wave3SmartAccount",
		version: "1",
		chainId: Number((await ethers.provider.getNetwork()).chainId),
		verifyingContract: await smartAccount.getAddress()
	});

	const getSignature = async ({
		target,
		value,
		data,
		nonce,
		deadline
	}: {
		target: string;
		value: bigint;
		data: string;
		nonce: bigint;
		deadline: bigint;
	}) => {
		return owner.signTypedData(
			await getDomain(),
			{
				Execute: [
					{ name: "target", type: "address" },
					{ name: "value", type: "uint256" },
					{ name: "dataHash", type: "bytes32" },
					{ name: "nonce", type: "uint256" },
					{ name: "deadline", type: "uint256" }
				]
			},
			{
				target,
				value,
				dataHash: ethers.keccak256(data),
				nonce,
				deadline
			}
		);
	};

	const getAuthorizeSessionSignature = async ({
		sessionKey,
		target,
		selector,
		validUntil,
		maxCalls,
		nonce,
		deadline
	}: {
		sessionKey: string;
		target: string;
		selector: string;
		validUntil: bigint;
		maxCalls: number;
		nonce: bigint;
		deadline: bigint;
	}) => {
		return owner.signTypedData(
			await getDomain(),
			{
				AuthorizeSessionKey: [
					{ name: "sessionKey", type: "address" },
					{ name: "target", type: "address" },
					{ name: "selector", type: "bytes4" },
					{ name: "validUntil", type: "uint64" },
					{ name: "maxCalls", type: "uint32" },
					{ name: "nonce", type: "uint256" },
					{ name: "deadline", type: "uint256" }
				]
			},
			{
				sessionKey,
				target,
				selector,
				validUntil,
				maxCalls,
				nonce,
				deadline
			}
		);
	};

	const getExecuteSessionSignature = async ({
		sessionKey,
		target,
		value,
		data,
		nonce,
		deadline
	}: {
		sessionKey: string;
		target: string;
		value: bigint;
		data: string;
		nonce: bigint;
		deadline: bigint;
	}) => {
		return sessionWallet.signTypedData(
			await getDomain(),
			{
				ExecuteSession: [
					{ name: "sessionKey", type: "address" },
					{ name: "target", type: "address" },
					{ name: "value", type: "uint256" },
					{ name: "dataHash", type: "bytes32" },
					{ name: "nonce", type: "uint256" },
					{ name: "deadline", type: "uint256" }
				]
			},
			{
				sessionKey,
				target,
				value,
				dataHash: ethers.keccak256(data),
				nonce,
				deadline
			}
		);
	};

	const createSongCatalog = async () => {
		await songsFactory.connect(owner).addAlbum({
			name: "Wave Album",
			artist: "Wave Artist",
			genre: "Electronic",
			year: 2026,
			imageCID: "ipfs://cover",
			songs: [
				{
					name: "Wave Song",
					audioCID: "ipfs://audio",
					playFee: ethers.parseEther("1"),
					buyPrice: ethers.parseEther("10"),
					totalParts: 10,
					nonSellableParts: 2
				}
			]
		});
	};

	beforeEach(async () => {
		[owner, relayer] = await ethers.getSigners();
		sessionWallet = ethers.Wallet.createRandom();

		const SongsModel = await ethers.getContractFactory("SongsModel");
		songsModel = await SongsModel.deploy();

		const Wavecoin = await ethers.getContractFactory("Wavecoin");
		wavecoin = await Wavecoin.deploy(owner.address, owner.address, await songsModel.getAddress());
		await songsModel.setWavecoin(await wavecoin.getAddress());

		const SongRoyalties = await ethers.getContractFactory("SongRoyalties");
		songRoyalties = await SongRoyalties.deploy(
			await wavecoin.getAddress(),
			await songsModel.getAddress(),
			owner.address
		);
		await songsModel.setSongRoyalties(await songRoyalties.getAddress());

		const SongsFactory = await ethers.getContractFactory("SongsFactory");
		songsFactory = await SongsFactory.deploy(await wavecoin.getAddress(), await songsModel.getAddress());

		const Factory = await ethers.getContractFactory("Wave3SmartAccountFactory");
		factory = await Factory.deploy(await wavecoin.getAddress());
		await wavecoin.setSmartAccountFactory(await factory.getAddress());

		await factory.createAccount(owner.address);
		const smartAccountAddress = await factory.getAccount(owner.address);
		smartAccount = await ethers.getContractAt("Wave3SmartAccount", smartAccountAddress);
	});

	it("executes a sponsored tx signed by owner", async function () {
		const amount = ethers.parseEther("5");
		const mintData = wavecoin.interface.encodeFunctionData("mint", [amount]);
		const deadline = (await blockTimestamp()) + 60n * 10n;
		const nonce = await smartAccount.nonce();

		const signature = await getSignature({
			target: await wavecoin.getAddress(),
			value: 0n,
			data: mintData,
			nonce,
			deadline
		});

		await smartAccount.connect(relayer).execute(await wavecoin.getAddress(), 0, mintData, deadline, signature);

		expect(await wavecoin.balanceOf(await smartAccount.getAddress())).to.equal(amount);
		expect(await smartAccount.nonce()).to.equal(1);
	});

	it("rejects invalid signature", async function () {
		const mintData = wavecoin.interface.encodeFunctionData("mint", [1n]);
		const deadline = (await blockTimestamp()) + 60n * 10n;
		const nonce = await smartAccount.nonce();

		const invalidSignature = await relayer.signTypedData(
			await getDomain(),
			{
				Execute: [
					{ name: "target", type: "address" },
					{ name: "value", type: "uint256" },
					{ name: "dataHash", type: "bytes32" },
					{ name: "nonce", type: "uint256" },
					{ name: "deadline", type: "uint256" }
				]
			},
			{
				target: await wavecoin.getAddress(),
				value: 0n,
				dataHash: ethers.keccak256(mintData),
				nonce,
				deadline
			}
		);

		await expect(
			smartAccount.connect(relayer).execute(await wavecoin.getAddress(), 0, mintData, deadline, invalidSignature)
		).to.be.revertedWithCustomError(smartAccount, "InvalidSignature");
	});

	it("authorizes a playback session key and executes limited buyPlay calls", async function () {
		await createSongCatalog();

		const target = await wavecoin.getAddress();
		const selector = wavecoin.interface.getFunction("buyPlayFor").selector;
		const nonce = await smartAccount.nonce();
		const authorizeDeadline = (await blockTimestamp()) + 60n * 10n;
		const validUntil = (await blockTimestamp()) + 60n * 60n;
		const maxCalls = 2;

		const authorizeSignature = await getAuthorizeSessionSignature({
			sessionKey: sessionWallet.address,
			target,
			selector,
			validUntil,
			maxCalls,
			nonce,
			deadline: authorizeDeadline
		});

		await smartAccount
			.connect(relayer)
			.authorizeSessionKey(
				sessionWallet.address,
				target,
				selector,
				validUntil,
				maxCalls,
				authorizeDeadline,
				authorizeSignature
			);

		const mintAmount = ethers.parseEther("5");
		await wavecoin.connect(owner).mint(mintAmount);

		expect(await wavecoin.approvedPlaybackOperators(owner.address, await smartAccount.getAddress())).to.equal(true);

		const buyPlayData = wavecoin.interface.encodeFunctionData("buyPlayFor", [0n, owner.address]);

		const sessionNonce0 = await smartAccount.sessionNonces(sessionWallet.address);
		const sessionDeadline0 = (await blockTimestamp()) + 60n * 10n;
		const sessionSignature0 = await getExecuteSessionSignature({
			sessionKey: sessionWallet.address,
			target,
			value: 0n,
			data: buyPlayData,
			nonce: sessionNonce0,
			deadline: sessionDeadline0
		});

		await expect(
			smartAccount
				.connect(relayer)
				.executeSession(sessionWallet.address, target, 0, buyPlayData, sessionDeadline0, sessionSignature0)
		)
			.to.emit(songsModel, "SongPlayed")
			.withArgs(0n, owner.address);

		const sessionNonce1 = await smartAccount.sessionNonces(sessionWallet.address);
		const sessionDeadline1 = (await blockTimestamp()) + 60n * 10n;
		const sessionSignature1 = await getExecuteSessionSignature({
			sessionKey: sessionWallet.address,
			target,
			value: 0n,
			data: buyPlayData,
			nonce: sessionNonce1,
			deadline: sessionDeadline1
		});

		await smartAccount
			.connect(relayer)
			.executeSession(sessionWallet.address, target, 0, buyPlayData, sessionDeadline1, sessionSignature1);

		expect(await wavecoin.balanceOf(owner.address)).to.equal(ethers.parseEther("3"));
		expect(await wavecoin.balanceOf(await songRoyalties.getAddress())).to.equal(ethers.parseEther("2"));

		const sessionNonce2 = await smartAccount.sessionNonces(sessionWallet.address);
		const sessionDeadline2 = (await blockTimestamp()) + 60n * 10n;
		const sessionSignature2 = await getExecuteSessionSignature({
			sessionKey: sessionWallet.address,
			target,
			value: 0n,
			data: buyPlayData,
			nonce: sessionNonce2,
			deadline: sessionDeadline2
		});

		await expect(
			smartAccount
				.connect(relayer)
				.executeSession(sessionWallet.address, target, 0, buyPlayData, sessionDeadline2, sessionSignature2)
		).to.be.revertedWithCustomError(smartAccount, "SessionUsageExceeded");
	});

	it("works when owner has zero native balance and relayer sponsors gas", async function () {
		const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);
		expect(ownerBalanceBefore).to.be.gt(0);

		try {
			await ethers.provider.send("hardhat_setBalance", [owner.address, "0x0"]);
			const ownerBalanceAfterSet = await ethers.provider.getBalance(owner.address);
			expect(ownerBalanceAfterSet).to.equal(0n);

			const relayerBalanceBefore = await ethers.provider.getBalance(relayer.address);

			const mintData = wavecoin.interface.encodeFunctionData("mint", [1n]);
			const deadline = (await blockTimestamp()) + 60n * 10n;
			const nonce = await smartAccount.nonce();
			const signature = await getSignature({
				target: await wavecoin.getAddress(),
				value: 0n,
				data: mintData,
				nonce,
				deadline
			});

			await smartAccount.connect(relayer).execute(await wavecoin.getAddress(), 0, mintData, deadline, signature);

			const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
			const relayerBalanceAfter = await ethers.provider.getBalance(relayer.address);

			expect(ownerBalanceAfter).to.equal(0n);
			expect(relayerBalanceAfter).to.be.lt(relayerBalanceBefore);
		} finally {
			await ethers.provider.send("hardhat_setBalance", [owner.address, ethers.toBeHex(ownerBalanceBefore)]);
		}
	});
});
