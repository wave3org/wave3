//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Song {
	address private owner;

	string private name;

	string private audioCID;

	uint256 private albumId;

	uint256 private playFee;

	constructor(
		address _owner,
		string memory _name,
		string memory _audioCID,
		uint256 _albumId,
		uint256 _playFee
	) {
		owner = _owner;
		name = _name;
		audioCID = _audioCID;
		albumId = _albumId;
		playFee = _playFee;
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
}
