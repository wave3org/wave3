//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Album {
	uint256 private id;

	address private owner;

	string private name;

	string private artist;

	string private imageCID;

	string private genre;

	uint256 private year;

	constructor(uint256 _id, address _owner, string memory _name, string memory _artist, string memory _imageCID, string memory _genre, uint256 _year) {
		id = _id;
		owner = _owner;
		name = _name;
		artist = _artist;
		imageCID = _imageCID;
		genre = _genre;
		year = _year;
	}

	function getId() external view returns (uint256) {
		return id;
	}

	function getOwner() external view returns (address) {
		return owner;
	}

	function getName() external view returns (string memory) {
		return name;
	}

	function getArtist() external view returns (string memory) {
		return artist;
	}

	function getImageCID() external view returns (string memory) {
		return imageCID;
	}

	function getGenre() external view returns (string memory) {
		return genre;
	}

	function getYear() external view returns (uint256) {
		return year;
	}
}
