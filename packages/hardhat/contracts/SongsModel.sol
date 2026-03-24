//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Wavecoin.sol";
import "./AlbumsManager.sol";
import "./SongsManager.sol";

contract SongsModel {
	AlbumsManager private albumsManager;

	SongsManager private songsManager;

	event PartsPurchased(uint256 indexed songId, address indexed buyer, uint256 parts);

	event SongPlayed(uint256 indexed songId, address indexed listener);

	event RoyaltiesWithdrawn(uint256 indexed songId, address indexed holder);

	constructor() {
		albumsManager = new AlbumsManager();
		songsManager = new SongsManager();
	}

	function addAlbum(
		address _owner,
		string memory _name,
		string memory _artist,
		string memory _imageCID
	) external returns (uint256) {
		return albumsManager.addAlbum(_owner, _name, _artist, _imageCID);
	}

	function getAlbum(uint256 _id) external view returns (Album) {
		return albumsManager.getAlbum(_id);
	}

	function addSong(
		address _owner,
		string memory _name,
		string memory _audioCID,
		uint256 _albumId,
		uint256 _playFee,
		uint256 _partPrice,
		uint256 _totalParts,
		uint256 _nonSellableParts,
		Wavecoin _wavecoin
	) external returns (uint256) {
		return
			songsManager.addSong(
				_owner,
				_name,
				_audioCID,
				_albumId,
				_playFee,
				_partPrice,
				_totalParts,
				_nonSellableParts,
				_wavecoin
			);
	}

	function getSong(uint256 _id) external view returns (Song) {
		return songsManager.getSong(_id);
	}

	function preBuyParts(uint256 _songId, uint256 _numberOfParts) external view returns (uint256, address) {
		Song song = songsManager.getSong(_songId);

		return (song.getTotalPrice(_numberOfParts), song.getOwner());
	}

	function buyParts(uint256 _songId, address _buyer, uint256 _numberOfParts) external {
		Song song = songsManager.getSong(_songId);

		song.buyParts(_buyer, _numberOfParts);

		emit PartsPurchased(_songId, msg.sender, _numberOfParts);
	}

	function preBuyPlay(uint256 _songId) external view returns (uint256, address) {
		Song song = songsManager.getSong(_songId);

		return (song.getPlayFee(), address(song));
	}

	function buyPlay(uint256 _songId) external {
		Song song = songsManager.getSong(_songId);

		song.buyPlay();

		emit SongPlayed(_songId, msg.sender);
	}

	function withdrawRoyalties(uint256 _songId, address _holder) external returns (uint256, address) {
		Song song = songsManager.getSong(_songId);

		emit RoyaltiesWithdrawn(_songId, msg.sender);

		return (song.withdrawRoyalties(_holder), address(song));
	}
}
