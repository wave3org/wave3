import { ethers } from "hardhat";
import wavecoinDeployment from "../deployments/localhost/Wavecoin.json";
import songsDeployment from "../deployments/localhost/Songs.json";
import royaltiesDeployment from "../deployments/localhost/SongRoyalties.json";

async function main() {
  const signers = await ethers.getSigners();
  const [, artist, ...users] = signers;

  const Wavecoin = await ethers.getContractFactory("Wavecoin");
  const wavecoin = Wavecoin.attach(wavecoinDeployment.address) as any;

  const Songs = await ethers.getContractFactory("Songs");
  const songs = Songs.attach(songsDeployment.address) as any;

  const SongRoyalties = await ethers.getContractFactory("SongRoyalties");
  const royalties = SongRoyalties.attach(royaltiesDeployment.address) as any;

  // Create 10 songs
  console.log("Creating songs...");
  for (let i = 0; i < 10; i++) {
    await songs.connect(artist).addSong(`Song ${i}`, `QmAudio${i}`, 0);
  }

  // Setup 15 users with WAVE and approvals
  console.log("Setting up users...");
  const amount = ethers.parseEther("1000");
  for (let i = 0; i < 15; i++) {
    await wavecoin.connect(users[i]).mint(amount);
    await wavecoin.connect(users[i]).approve(await royalties.getAddress(), amount);
  }

  // Generate plays
  console.log("Generating plays...");
  for (let i = 0; i < 15; i++) {
    for (let j = 0; j < 5; j++) {
      const songId = (i + j) % 10;
      await royalties.connect(users[i]).playSong(songId);
    }
  }

  console.log("Done!");
}

main().catch(console.error);
