import { expect } from "chai";
import { ethers } from "hardhat";

describe("Albums", function () {
  let albums: any;
  let owner: any;

  before(async () => {
    [owner] = await ethers.getSigners();
    const Albums = await ethers.getContractFactory("Albums");
    albums = await Albums.deploy();
  });

  it("Should create an album", async function () {
    await albums.addAlbum("My Album", "QmImageCID");
    const album = await albums.albums(0);

    expect(album.name).to.equal("My Album");
    expect(album.artist).to.equal(owner.address);
    expect(album.imageCID).to.equal("QmImageCID");
  });
});
