//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Song.sol";

contract SongsManager {
	uint256 private nextId;

	mapping(uint256 => Song) private songs;

	event AddedSong(uint256 indexed id, address indexed owner, string name, string audioCID, uint256 indexed albumId);

	function addSong(
		address _owner,
		string memory _name,
		string memory _audioCID,
		uint256 _albumId,
		uint256 _playFee
	) external returns (uint256) {
		uint256 currentId = nextId;

		songs[currentId] = new Song(_owner, _name, _audioCID, _albumId, _playFee);

		emit AddedSong(currentId, _owner, _name, _audioCID, _albumId);

		nextId++;

		return currentId;
	}

	function getSong(uint256 _id) external view returns (Song) {
		return songs[_id];
	}
}
