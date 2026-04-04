//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Album.sol";

contract AlbumsManager {
	uint256 private nextId;

	mapping(uint256 => Album) public albums;

	event AlbumAdded(uint256 indexed id, address indexed owner, string name, string artist, string imageCID, string genre, uint256 year);

	function addAlbum(
		address _owner,
		string memory _name,
		string memory _artist,
		string memory _imageCID,
		string memory _genre,
		uint256 _year
	) public returns (uint256) {
		uint256 currentId = nextId;

		albums[currentId] = new Album(nextId, _owner, _name, _artist, _imageCID, _genre, _year);

		emit AlbumAdded(currentId, _owner, _name, _artist, _imageCID, _genre, _year);

		nextId++;

		return currentId;
	}

	function getAlbum(uint256 _id) public view returns (Album) {
		return albums[_id];
	}
}
