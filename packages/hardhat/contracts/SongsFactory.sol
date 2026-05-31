//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Wavecoin.sol";
import "./SongsModel.sol";

contract SongsFactory {
	struct AddAlbumRequest {
		string name;
		string artist;
		string genre;
		uint256 year;
		string imageCID;
		AddSongRequest[] songs;
	}

	struct AddSongRequest {
		string name;
		string audioCID;
		uint256 playFee;
		uint256 buyPrice;
		uint256 sellPrice;
		uint256 totalParts;
		uint256 nonSellableParts;
	}

	Wavecoin private wavecoin;

	SongsModel private songsModel;

	constructor(Wavecoin _wavecoin, SongsModel _songsModel) {
		wavecoin = _wavecoin;
		songsModel = _songsModel;
	}

	function addAlbum(AddAlbumRequest memory _addAlbumRequest) public {
		uint256 albumId = songsModel.addAlbum(
			msg.sender,
			_addAlbumRequest.name,
			_addAlbumRequest.artist,
			_addAlbumRequest.genre,
			_addAlbumRequest.year,
			_addAlbumRequest.imageCID
		);

		for (uint256 i = 0; i < _addAlbumRequest.songs.length; i++) {
			addSong(albumId, _addAlbumRequest.songs[i]);
		}
	}

	function addSong(uint256 albumId, AddSongRequest memory _addSongRequest) private {
		songsModel.addSong(
			msg.sender,
			_addSongRequest.name,
			_addSongRequest.audioCID,
			albumId,
			_addSongRequest.playFee,
			_addSongRequest.buyPrice,
			_addSongRequest.sellPrice,
			_addSongRequest.totalParts,
			_addSongRequest.nonSellableParts,
			wavecoin
		);
	}
}
