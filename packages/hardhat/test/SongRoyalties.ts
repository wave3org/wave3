import { expect } from "chai";
import { ethers } from "hardhat";

describe("SongRoyalties", function () {
  let wavecoin: any;
  let songs: any;
  let royalties: any;
  let artist: any;
  let listener: any;
  let buyer: any;

  before(async () => {
    const signers = await ethers.getSigners();
    artist = signers[1];
    listener = signers[2];
    buyer = signers[3];

    // Deploy Wavecoin
    const Wavecoin = await ethers.getContractFactory("Wavecoin");
    wavecoin = await Wavecoin.deploy();

    // Deploy Songs
    const Songs = await ethers.getContractFactory("Songs");
    songs = await Songs.deploy();

    // Deploy SongRoyalties
    const SongRoyalties = await ethers.getContractFactory("SongRoyalties");
    royalties = await SongRoyalties.deploy(await wavecoin.getAddress(), await songs.getAddress());

    // Artist creates song
    await songs.connect(artist).addSong("Test Song", "QmAudio", 0);

    // Mint WAVE to listener
    await wavecoin.connect(listener).mint(ethers.parseEther("100"));
  });

  it("Should play song and accumulate royalties", async function () {
    await wavecoin.connect(listener).approve(await royalties.getAddress(), ethers.parseEther("1"));

    await royalties.connect(listener).playSong(0);

    expect(await royalties.songRoyalties(0)).to.equal(ethers.parseEther("1"));
  });

  it("Should allow shareholder to withdraw royalties", async function () {
    const balanceBefore = await wavecoin.balanceOf(artist.address);

    await royalties.connect(artist).withdrawRoyalties(0);

    const balanceAfter = await wavecoin.balanceOf(artist.address);
    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1"));
    expect(await royalties.songRoyalties(0)).to.equal(0);
  });

  it("Should accumulate royalties from multiple plays and distribute by shares", async function () {
    await songs.connect(artist).addSong("Second Song", "QmAudio2", 0);

    await wavecoin.connect(listener).approve(await royalties.getAddress(), ethers.parseEther("3"));

    await royalties.connect(listener).playSong(1);
    await royalties.connect(listener).playSong(1);
    await royalties.connect(listener).playSong(1);

    expect(await royalties.songRoyalties(1)).to.equal(ethers.parseEther("3"));

    const balanceBefore = await wavecoin.balanceOf(artist.address);
    await royalties.connect(artist).withdrawRoyalties(1);
    const balanceAfter = await wavecoin.balanceOf(artist.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("3"));
    expect(await royalties.songRoyalties(1)).to.equal(0);
  });

  it("Should price shares based on accumulated royalties", async function () {
    // First accumulate some royalties for song 0
    await wavecoin.connect(listener).approve(await royalties.getAddress(), ethers.parseEther("10"));

    // 10 plays = 10 WAVE in royalties
    for (let i = 0; i < 10; i++) {
      await royalties.connect(listener).playSong(0);
    }

    expect(await royalties.songRoyalties(0)).to.equal(ethers.parseEther("10"));

    // Now buyer wants to buy 20 shares (20% of 100)
    // Price should be 20% of 10 WAVE = 2 WAVE
    await wavecoin.connect(buyer).mint(ethers.parseEther("100"));

    const sharesToBuy = 20;
    const expectedPrice = ethers.parseEther("2"); // 20% of 10 WAVE

    await wavecoin.connect(buyer).approve(await royalties.getAddress(), expectedPrice);

    await songs.connect(artist).setApprovalForAll(await royalties.getAddress(), true);

    const artistBalanceBefore = await wavecoin.balanceOf(artist.address);

    await royalties.connect(buyer).buyShares(0, artist.address, sharesToBuy);

    const artistBalanceAfter = await wavecoin.balanceOf(artist.address);
    expect(artistBalanceAfter - artistBalanceBefore).to.equal(expectedPrice);

    const buyerShares = await songs.balanceOf(buyer.address, 0);
    expect(buyerShares).to.equal(sharesToBuy);
  });

  it("Should demonstrate share value increases with plays", async function () {
    await songs.connect(artist).addSong("New Song", "QmAudio3", 0);
    const songId = 2;

    await songs.connect(artist).setApprovalForAll(await royalties.getAddress(), true);
    await wavecoin.connect(listener).mint(ethers.parseEther("100"));

    let totalRoyalties = await royalties.songRoyalties(songId);
    let priceFor10Shares = (totalRoyalties * BigInt(10)) / BigInt(100);
    expect(priceFor10Shares).to.equal(0);

    await wavecoin.connect(listener).approve(await royalties.getAddress(), ethers.parseEther("100"));
    for (let i = 0; i < 100; i++) {
      await royalties.connect(listener).playSong(songId);
    }

    totalRoyalties = await royalties.songRoyalties(songId);
    priceFor10Shares = (totalRoyalties * BigInt(10)) / BigInt(100);
    expect(priceFor10Shares).to.equal(ethers.parseEther("10"));
  });
});
