//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./RoyaltiesDistribution.sol";
import "./Wavecoin.sol";

contract Song {
	address private owner;

	string private name;

	string private audioCID;

	uint256 private albumId;

	uint256 private playFee;

	RoyaltiesDistribution private royaltiesDistribution;

	Wavecoin private wavecoin;

	constructor(
		address _owner,
		string memory _name,
		string memory _audioCID,
		uint256 _albumId,
		uint256 _playFee,
		uint256 _partPrice,
		uint256 _totalParts,
		uint256 _nonSellableParts,
		Wavecoin _wavecoin
	) {
		owner = _owner;
		name = _name;
		audioCID = _audioCID;
		albumId = _albumId;
		playFee = _playFee;
		royaltiesDistribution = new RoyaltiesDistribution(_owner, _partPrice, _totalParts, _nonSellableParts);
		wavecoin = _wavecoin;
	}

	function getOwner() external view returns (address) {
		return owner;
	}

	function getName() external view returns (string memory) {
		return name;
	}

	function getAudioCID() external view returns (string memory) {
		return audioCID;
	}

	function getAlbumId() external view returns (uint256) {
		return albumId;
	}

	function getPlayFee() external view returns (uint256) {
		return playFee;
	}

	function getPartPrice() external view returns (uint256) {
		return royaltiesDistribution.getPartPrice();
	}

	function getTotalParts() external view returns (uint256) {
		return royaltiesDistribution.getTotalParts();
	}

	function getAvailableParts() external view returns (uint256) {
		return royaltiesDistribution.getAvailableParts();
	}

	function getTotalPrice(uint256 _numberOfParts) external view returns (uint256) {
		return royaltiesDistribution.getTotalPrice(_numberOfParts);
	}

	function buyParts(address _buyer, uint256 _numberOfParts) external {
		royaltiesDistribution.buyParts(_buyer, _numberOfParts);
	}

	function isSellOptionAvailable() external view returns (bool) {
		return royaltiesDistribution.isSellOptionAvailable();
	}

	function sellParts(address _seller, uint256 _numberOfParts) external returns (uint256){
		uint256 amount = royaltiesDistribution.sellParts(_seller, _numberOfParts);

		wavecoin.approve(_seller, amount);

		return amount;
	}

	function buyPlay(uint256 _songId) external returns (address[] memory, uint256[] memory) {
		return royaltiesDistribution.distributeRevenue(playFee, _songId);
	}

	function getPendingRoyalties(address _holder) external view returns (uint256) {
		return royaltiesDistribution.getPendingBalance(_holder);
	}

	function withdrawRoyalties(address _holder) external returns (uint256) {
		uint256 amountWithdrawn = royaltiesDistribution.withdraw(_holder);

		wavecoin.approve(_holder, amountWithdrawn);

		return amountWithdrawn;
	}
}
