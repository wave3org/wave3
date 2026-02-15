import { expect } from "chai";
import { ethers } from "hardhat";

describe("Songs", function () {
  let songs: any;
  let albums: any;
  let artist: any;

  before(async () => {
    [artist] = await ethers.getSigners();

    const Albums = await ethers.getContractFactory("Albums");
    albums = await Albums.deploy();

    const Songs = await ethers.getContractFactory("Songs");
    songs = await Songs.deploy();
  });

  it("Should create a song and mint shares to creator", async function () {
    await songs.connect(artist).addSong("My Song", "QmAudioCID", 0);
    const song = await songs.songs(0);

    expect(song.name).to.equal("My Song");
    expect(song.audioCID).to.equal("QmAudioCID");
    expect(song.albumId).to.equal(0);

    // Check artist got all shares
    const shares = await songs.balanceOf(artist.address, 0);
    expect(shares).to.equal(100);
  });

  it("Should add song to an album", async function () {
    await albums.connect(artist).addAlbum("Test Album", "QmImageCID");
    const album = await albums.albums(0);

    await songs.connect(artist).addSong("Album Song", "QmAudioCID2", album.id);
    const song = await songs.songs(1);

    expect(song.name).to.equal("Album Song");
    expect(song.albumId).to.equal(album.id);
  });
});
