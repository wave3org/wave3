//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./SongsModel.sol";

contract SongsPresenter {
	struct AlbumResponse {
		uint256 id;
		string name;
		string artist;
		string imageCID;
		string genre;
		uint256 year;
	}

	struct SongResponse {
		uint256 id;
		string name;
		string audioCID;
		uint256 playFee;
		uint256 buyPrice;
		uint256 sellPrice;
		AlbumResponse album;
		RoyaltiesDistributionResponse royaltiesDistribution;
	}

	struct RoyaltiesDistributionResponse {
		uint256 buyPrice;
		uint256 sellPrice;
		uint256 totalParts;
		uint256 availableParts;
	}

	struct SongsResponse {
		SongResponse[] songs;
	}

	SongsModel private songsModel;

	constructor(SongsModel _songsModel) {
		songsModel = _songsModel;
	}

	function getSong(uint256 _id) public view returns (SongResponse memory) {
		Song song = songsModel.getSong(_id);
		Album album = songsModel.getAlbum(song.getAlbumId());
		SongResponse memory songResponse;

		songResponse.id = _id;
		songResponse.name = song.getName();
		songResponse.audioCID = song.getAudioCID();
		songResponse.playFee = song.getPlayFee();
		songResponse.buyPrice = song.getBuyPrice();
		songResponse.sellPrice = song.getSellPrice();

		songResponse.album = AlbumResponse({
			id: album.getId(),
			name: album.getName(),
			artist: album.getArtist(),
			imageCID: album.getImageCID(),
			genre: album.getGenre(),
			year: album.getYear()
		});

		songResponse.royaltiesDistribution = RoyaltiesDistributionResponse({
			buyPrice: song.getBuyPrice(),
			sellPrice: song.getSellPrice(),
			totalParts: song.getTotalParts(),
			availableParts: song.getAvailableParts()
		});

		return songResponse;
	}

	function getSongs(uint256[] memory _ids) public view returns (SongsResponse memory) {
		SongResponse[] memory _songs = new SongResponse[](_ids.length);

		for (uint i = 0; i < _ids.length; i++) {
			_songs[i] = getSong(_ids[i]);
		}

		return SongsResponse({ songs: _songs });
	}

	function getPendingRoyalties(uint256 _songId, address _holder) external view returns (uint256) {
		Song song = songsModel.getSong(_songId);
		return song.getPendingRoyalties(_holder);
	}
}
