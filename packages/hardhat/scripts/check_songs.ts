import { ethers } from "hardhat";
async function main() {
	const presenter = await ethers.getContractAt("SongsPresenter", "0x655a621D5e52b6F0416F5d900FC61c121c90Da47");
	for (const id of [1, 2, 28]) {
		try {
			const r = await presenter.getSong(id);
			console.log(`Song ${id}: ${r.name}`);
		} catch {
			console.log(`Song ${id}: REVERT`);
		}
	}
}
main();
