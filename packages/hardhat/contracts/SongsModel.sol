//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Wavecoin.sol";
import "./AlbumsManager.sol";
import "./SongsManager.sol";
import "./SongRoyalties.sol";

contract SongsModel {
	address private owner;

	AlbumsManager private albumsManager;

	SongsManager private songsManager;

	SongRoyalties private songRoyalties;

	Wavecoin private wavecoin;

	event AlbumAdded(
		uint256 indexed id,
		address indexed owner,
		string name,
		string artist,
		string imageCID,
		string genre,
		uint256 year
	);

	event SongAdded(uint256 indexed id, address indexed owner, string name, string audioCID, uint256 indexed albumId);

	event SongPurchase(uint256 indexed songId, address indexed buyer, uint256 parts);

	event SongPlayed(uint256 indexed songId, address indexed listener);

	event RoyaltiesWithdrawn(uint256 indexed songId, address indexed holder);

	event SongBoosted(uint256 indexed songId, address indexed payer, uint256 expiresAt);

	event RoyaltyDistributed(uint256 indexed songId, address indexed holder, uint256 amount);

	mapping(uint256 => uint256) public boostExpiry;

	uint256 public constant BOOST_PRICE = 10e18;
	uint256 public constant BOOST_DURATION = 30 days;

	constructor() {
		owner = msg.sender;
		albumsManager = new AlbumsManager();
		songsManager = new SongsManager();
	}

	modifier onlyOwner() {
		require(msg.sender == owner, "Only owner");
		_;
	}

	modifier onlyWavecoin() {
		require(msg.sender == address(wavecoin), "Only wavecoin");
		_;
	}

	function setSongRoyalties(SongRoyalties _songRoyalties) external onlyOwner {
		require(address(_songRoyalties) != address(0), "Invalid song royalties");
		require(address(songRoyalties) == address(0), "Song royalties already set");

		songRoyalties = _songRoyalties;
	}

	function setWavecoin(Wavecoin _wavecoin) external onlyOwner {
		require(address(_wavecoin) != address(0), "Invalid wavecoin");
		require(address(wavecoin) == address(0), "Wavecoin already set");

		wavecoin = _wavecoin;
	}

	function addAlbum(
		address _owner,
		string memory _name,
		string memory _artist,
		string memory _genre,
		uint256 _year,
		string memory _imageCID
	) external returns (uint256) {
		uint256 id = albumsManager.addAlbum(_owner, _name, _artist, _genre, _year, _imageCID);

		emit AlbumAdded(id, _owner, _name, _artist, _imageCID, _genre, _year);

		return id;
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
		uint256 _buyPrice,
		uint256 _totalParts,
		uint256 _nonSellableParts,
		Wavecoin _wavecoin
	) external returns (uint256) {
		require(address(songRoyalties) != address(0), "Song royalties not set");
		require(address(wavecoin) != address(0), "Wavecoin not set");
		require(_wavecoin == wavecoin, "Unexpected wavecoin");

		uint256 id = songsManager.addSong(_owner, _name, _audioCID, _albumId, _playFee);

		songRoyalties.createSongShares(id, _owner, _buyPrice, _totalParts, _nonSellableParts, _playFee);

		emit SongAdded(id, _owner, _name, _audioCID, _albumId);

		return id;
	}

	function getSong(uint256 _id) external view returns (Song) {
		return songsManager.getSong(_id);
	}

	function preBuyParts(uint256 _songId, uint256 _numberOfParts) external view returns (uint256, address) {
		return (songRoyalties.getTotalPrice(_songId, _numberOfParts), address(songRoyalties));
	}

	function buyParts(uint256 _songId, address _buyer, uint256 _numberOfParts) external onlyWavecoin {
		songRoyalties.buyParts(_songId, _buyer, _numberOfParts);

		emit SongPurchase(_songId, _buyer, _numberOfParts);
	}

	function preBuyPlay(uint256 _songId) external view returns (uint256, address) {
		return (songRoyalties.getPlayFee(_songId), address(songRoyalties));
	}

	function buyPlay(uint256 _songId, address _listener) external onlyWavecoin {
		songRoyalties.recordRevenue(_songId, songRoyalties.getPlayFee(_songId));

		emit SongPlayed(_songId, _listener);
	}

	function withdrawRoyalties(uint256 _songId, address _holder) external onlyWavecoin returns (uint256, address) {
		emit RoyaltiesWithdrawn(_songId, _holder);

		return (songRoyalties.withdraw(_songId, _holder), address(songRoyalties));
	}

	function withdrawRoyaltiesMany(uint256[] calldata _songIds, address _holder) external onlyWavecoin returns (uint256, address) {
		for (uint256 i = 0; i < _songIds.length; i++) {
			emit RoyaltiesWithdrawn(_songIds[i], _holder);
		}

		return (songRoyalties.withdrawMany(_songIds, _holder), address(songRoyalties));
	}

	function getBuyPrice(uint256 _songId) external view returns (uint256) {
		return songRoyalties.getBuyPrice(_songId);
	}

	function getPartPrice(uint256 _songId) external view returns (uint256) {
		return songRoyalties.getPartPrice(_songId);
	}

	function getTotalParts(uint256 _songId) external view returns (uint256) {
		return songRoyalties.getTotalParts(_songId);
	}

	function getAvailableParts(uint256 _songId) external view returns (uint256) {
		return songRoyalties.getAvailableParts(_songId);
	}

	function getPendingRoyalties(uint256 _songId, address _holder) external view returns (uint256) {
		return songRoyalties.pendingRoyalties(_songId, _holder);
	}

	function getPendingRoyaltiesMany(
		uint256[] calldata _songIds,
		address _holder
	) external view returns (uint256[] memory amounts, uint256 total, uint256 claimableTotal) {
		return songRoyalties.pendingRoyaltiesMany(_songIds, _holder);
	}

	function getSongRoyalties() external view returns (SongRoyalties) {
		return songRoyalties;
	}

	function boostSong(uint256 _songId, address _payer) external onlyWavecoin {
		Song song = songsManager.getSong(_songId);
		require(song.getOwner() == _payer, "Not song owner");

		uint256 newExpiry = block.timestamp + BOOST_DURATION;
		if (boostExpiry[_songId] > block.timestamp) {
			newExpiry = boostExpiry[_songId] + BOOST_DURATION;
		}

		boostExpiry[_songId] = newExpiry;
		emit SongBoosted(_songId, _payer, newExpiry);
	}
}
