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
		AlbumResponse album;
		RoyaltiesDistributionResponse royaltiesDistribution;
	}

	struct RoyaltiesDistributionResponse {
		uint256 buyPrice;
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
		songResponse.buyPrice = songsModel.getBuyPrice(_id);

		songResponse.album = AlbumResponse({
			id: album.getId(),
			name: album.getName(),
			artist: album.getArtist(),
			imageCID: album.getImageCID(),
			genre: album.getGenre(),
			year: album.getYear()
		});

		songResponse.royaltiesDistribution = RoyaltiesDistributionResponse({
			buyPrice: songsModel.getBuyPrice(_id),
			totalParts: songsModel.getTotalParts(_id),
			availableParts: songsModel.getAvailableParts(_id)
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
		return songsModel.getPendingRoyalties(_songId, _holder);
	}

	function getPendingRoyaltiesMany(
		uint256[] calldata _songIds,
		address _holder
	) external view returns (uint256[] memory amounts, uint256 total, uint256 claimableTotal) {
		return songsModel.getPendingRoyaltiesMany(_songIds, _holder);
	}
}
