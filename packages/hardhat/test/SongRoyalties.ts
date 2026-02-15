import { expect } from "chai";
import { ethers } from "hardhat";

describe("SongRoyalties", function () {
  let wavecoin: any;
  let albums: any;
  let songs: any;
  let royalties: any;
  let artist: any;
  let listener: any;

  before(async () => {
    const signers = await ethers.getSigners();
    artist = signers[1];
    listener = signers[2];

    // Deploy Wavecoin
    const Wavecoin = await ethers.getContractFactory("Wavecoin");
    wavecoin = await Wavecoin.deploy();

    // Deploy Albums
    const Albums = await ethers.getContractFactory("Albums");
    albums = await Albums.deploy();

    // Deploy Songs
    const Songs = await ethers.getContractFactory("Songs");
    songs = await Songs.deploy();

    // Deploy SongRoyalties
    const SongRoyalties = await ethers.getContractFactory("SongRoyalties");
    royalties = await SongRoyalties.deploy(
      await wavecoin.getAddress(),
      await albums.getAddress(),
      await songs.getAddress(),
    );

    // Setup: Artist creates album and song
    await albums.connect(artist).addAlbum("Test Album", "QmTest");
    await songs.connect(artist).addSong("Test Song", "QmAudio", 0);

    // Mint WAVE to listener
    await wavecoin.connect(listener).mint(ethers.parseEther("100"));
  });

  it("Should play song and pay artist", async function () {
    // Approve royalties contract to spend listener's WAVE
    await wavecoin.connect(listener).approve(await royalties.getAddress(), ethers.parseEther("1"));

    // Play song
    await royalties.connect(listener).playSong(0);

    // Check artist got royalties
    expect(await royalties.artistRoyalties(artist.address)).to.equal(ethers.parseEther("1"));
  });

  it("Should allow artist to withdraw royalties", async function () {
    const balanceBefore = await wavecoin.balanceOf(artist.address);

    // Withdraw
    await royalties.connect(artist).withdrawRoyalties();

    const balanceAfter = await wavecoin.balanceOf(artist.address);
    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("1"));
    expect(await royalties.artistRoyalties(artist.address)).to.equal(0);
  });

  it("Should accumulate royalties from multiple songs and plays", async function () {
    // Add second song
    await songs.connect(artist).addSong("Second Song", "QmAudio2", 0);

    // Approve enough for 3 plays
    await wavecoin.connect(listener).approve(await royalties.getAddress(), ethers.parseEther("3"));

    // Play first song (ID 0) once
    await royalties.connect(listener).playSong(0);

    // Play second song (ID 1) twice
    await royalties.connect(listener).playSong(1);
    await royalties.connect(listener).playSong(1);

    // Artist should have 3 WAVE
    expect(await royalties.artistRoyalties(artist.address)).to.equal(ethers.parseEther("3"));

    // Withdraw
    const balanceBefore = await wavecoin.balanceOf(artist.address);
    await royalties.connect(artist).withdrawRoyalties();
    const balanceAfter = await wavecoin.balanceOf(artist.address);

    expect(balanceAfter - balanceBefore).to.equal(ethers.parseEther("3"));
    expect(await royalties.artistRoyalties(artist.address)).to.equal(0);
  });
});
