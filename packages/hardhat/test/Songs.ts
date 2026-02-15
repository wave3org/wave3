import { expect } from "chai";
import { ethers } from "hardhat";

describe("Songs", function () {
  let songs: any;
  let albums: any;

  before(async () => {
    const Albums = await ethers.getContractFactory("Albums");
    albums = await Albums.deploy();

    const Songs = await ethers.getContractFactory("Songs");
    songs = await Songs.deploy();
  });

  it("Should create a song", async function () {
    await songs.addSong("My Song", "QmAudioCID", 0);
    const song = await songs.songs(0);

    expect(song.name).to.equal("My Song");
    expect(song.audioCID).to.equal("QmAudioCID");
    expect(song.albumId).to.equal(0);
  });

  it("Should add song to an album", async function () {
    // Create album
    await albums.addAlbum("Test Album", "QmImageCID");
    const album = await albums.albums(0);

    // Add song to that album
    await songs.addSong("Album Song", "QmAudioCID2", album.id);
    const song = await songs.songs(1);

    expect(song.name).to.equal("Album Song");
    expect(song.albumId).to.equal(album.id);
  });
});
