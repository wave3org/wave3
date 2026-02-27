import { expect } from "chai";
import { ethers } from "hardhat";

describe("Wave3SmartAccount", function () {
  let wavecoin: any;
  let factory: any;
  let smartAccount: any;
  let owner: any;
  let relayer: any;
  let sessionWallet: any;

  const getSignature = async ({
    target,
    value,
    data,
    nonce,
    deadline,
  }: {
    target: string;
    value: bigint;
    data: string;
    nonce: bigint;
    deadline: bigint;
  }) => {
    const network = await ethers.provider.getNetwork();
    const domain = {
      name: "Wave3SmartAccount",
      version: "1",
      chainId: Number(network.chainId),
      verifyingContract: await smartAccount.getAddress(),
    };

    const types = {
      Execute: [
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "dataHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      target,
      value,
      dataHash: ethers.keccak256(data),
      nonce,
      deadline,
    };

    return owner.signTypedData(domain, types, message);
  };

  const getAuthorizeSessionSignature = async ({
    sessionKey,
    target,
    selector,
    validUntil,
    maxCalls,
    nonce,
    deadline,
  }: {
    sessionKey: string;
    target: string;
    selector: string;
    validUntil: bigint;
    maxCalls: number;
    nonce: bigint;
    deadline: bigint;
  }) => {
    const network = await ethers.provider.getNetwork();
    const domain = {
      name: "Wave3SmartAccount",
      version: "1",
      chainId: Number(network.chainId),
      verifyingContract: await smartAccount.getAddress(),
    };

    const types = {
      AuthorizeSessionKey: [
        { name: "sessionKey", type: "address" },
        { name: "target", type: "address" },
        { name: "selector", type: "bytes4" },
        { name: "validUntil", type: "uint64" },
        { name: "maxCalls", type: "uint32" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      sessionKey,
      target,
      selector,
      validUntil,
      maxCalls,
      nonce,
      deadline,
    };

    return owner.signTypedData(domain, types, message);
  };

  const getExecuteSessionSignature = async ({
    sessionKey,
    target,
    value,
    data,
    nonce,
    deadline,
  }: {
    sessionKey: string;
    target: string;
    value: bigint;
    data: string;
    nonce: bigint;
    deadline: bigint;
  }) => {
    const network = await ethers.provider.getNetwork();
    const domain = {
      name: "Wave3SmartAccount",
      version: "1",
      chainId: Number(network.chainId),
      verifyingContract: await smartAccount.getAddress(),
    };

    const types = {
      ExecuteSession: [
        { name: "sessionKey", type: "address" },
        { name: "target", type: "address" },
        { name: "value", type: "uint256" },
        { name: "dataHash", type: "bytes32" },
        { name: "nonce", type: "uint256" },
        { name: "deadline", type: "uint256" },
      ],
    };

    const message = {
      sessionKey,
      target,
      value,
      dataHash: ethers.keccak256(data),
      nonce,
      deadline,
    };

    return sessionWallet.signTypedData(domain, types, message);
  };

  before(async () => {
    [owner, relayer] = await ethers.getSigners();
    sessionWallet = ethers.Wallet.createRandom();

    const Wavecoin = await ethers.getContractFactory("Wavecoin");
    wavecoin = await Wavecoin.deploy();

    const Factory = await ethers.getContractFactory("Wave3SmartAccountFactory");
    factory = await Factory.deploy();

    await factory.createAccount(owner.address);
    const smartAccountAddress = await factory.getAccount(owner.address);
    smartAccount = await ethers.getContractAt("Wave3SmartAccount", smartAccountAddress);
  });

  it("executes a sponsored tx signed by owner", async function () {
    const amount = ethers.parseEther("5");
    const mintData = wavecoin.interface.encodeFunctionData("mint", [amount]);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
    const nonce = await smartAccount.nonce();

    const signature = await getSignature({
      target: await wavecoin.getAddress(),
      value: 0n,
      data: mintData,
      nonce,
      deadline,
    });

    await smartAccount.connect(relayer).execute(await wavecoin.getAddress(), 0, mintData, deadline, signature);

    expect(await wavecoin.balanceOf(await smartAccount.getAddress())).to.equal(amount);
    expect(await smartAccount.nonce()).to.equal(1);
  });

  it("rejects invalid signature", async function () {
    const mintData = wavecoin.interface.encodeFunctionData("mint", [1n]);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
    const nonce = await smartAccount.nonce();

    const invalidSignature = await relayer.signTypedData(
      {
        name: "Wave3SmartAccount",
        version: "1",
        chainId: Number((await ethers.provider.getNetwork()).chainId),
        verifyingContract: await smartAccount.getAddress(),
      },
      {
        Execute: [
          { name: "target", type: "address" },
          { name: "value", type: "uint256" },
          { name: "dataHash", type: "bytes32" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      },
      {
        target: await wavecoin.getAddress(),
        value: 0n,
        dataHash: ethers.keccak256(mintData),
        nonce,
        deadline,
      },
    );

    await expect(
      smartAccount.connect(relayer).execute(await wavecoin.getAddress(), 0, mintData, deadline, invalidSignature),
    ).to.be.revertedWithCustomError(smartAccount, "InvalidSignature");
  });

  it("authorizes a playback session key and executes limited calls", async function () {
    const target = await wavecoin.getAddress();
    const selector = wavecoin.interface.getFunction("mint").selector;
    const nonce = await smartAccount.nonce();
    const authorizeDeadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
    const validUntil = BigInt(Math.floor(Date.now() / 1000) + 60 * 60);
    const maxCalls = 2;

    const authorizeSignature = await getAuthorizeSessionSignature({
      sessionKey: sessionWallet.address,
      target,
      selector,
      validUntil,
      maxCalls,
      nonce,
      deadline: authorizeDeadline,
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
        authorizeSignature,
      );

    const mintAmount = ethers.parseEther("1");
    const mintData = wavecoin.interface.encodeFunctionData("mint", [mintAmount]);

    const sessionNonce0 = await smartAccount.sessionNonces(sessionWallet.address);
    const sessionDeadline0 = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
    const sessionSignature0 = await getExecuteSessionSignature({
      sessionKey: sessionWallet.address,
      target,
      value: 0n,
      data: mintData,
      nonce: sessionNonce0,
      deadline: sessionDeadline0,
    });

    await smartAccount
      .connect(relayer)
      .executeSession(sessionWallet.address, target, 0, mintData, sessionDeadline0, sessionSignature0);

    const sessionNonce1 = await smartAccount.sessionNonces(sessionWallet.address);
    const sessionDeadline1 = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
    const sessionSignature1 = await getExecuteSessionSignature({
      sessionKey: sessionWallet.address,
      target,
      value: 0n,
      data: mintData,
      nonce: sessionNonce1,
      deadline: sessionDeadline1,
    });

    await smartAccount
      .connect(relayer)
      .executeSession(sessionWallet.address, target, 0, mintData, sessionDeadline1, sessionSignature1);

    expect(await wavecoin.balanceOf(await smartAccount.getAddress())).to.equal(ethers.parseEther("7"));

    const sessionNonce2 = await smartAccount.sessionNonces(sessionWallet.address);
    const sessionDeadline2 = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
    const sessionSignature2 = await getExecuteSessionSignature({
      sessionKey: sessionWallet.address,
      target,
      value: 0n,
      data: mintData,
      nonce: sessionNonce2,
      deadline: sessionDeadline2,
    });

    await expect(
      smartAccount
        .connect(relayer)
        .executeSession(sessionWallet.address, target, 0, mintData, sessionDeadline2, sessionSignature2),
    ).to.be.revertedWithCustomError(smartAccount, "SessionUsageExceeded");
  });
});
