//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Wavecoin.sol";
import "./AlbumsManager.sol";
import "./SongsManager.sol";

contract SongsModel {
	AlbumsManager private albumsManager;

	SongsManager private songsManager;

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
		albumsManager = new AlbumsManager();
		songsManager = new SongsManager();
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
		uint256 _sellPrice,
		uint256 _totalParts,
		uint256 _nonSellableParts,
		Wavecoin _wavecoin
	) external returns (uint256) {
		uint256 id = songsManager.addSong(
			_owner,
			_name,
			_audioCID,
			_albumId,
			_playFee,
			_buyPrice,
			_sellPrice,
			_totalParts,
			_nonSellableParts,
			_wavecoin
		);

		emit SongAdded(id, _owner, _name, _audioCID, _albumId);

		return id;
	}

	function getSong(uint256 _id) external view returns (Song) {
		return songsManager.getSong(_id);
	}

	function preBuyParts(uint256 _songId, uint256 _numberOfParts) external view returns (uint256, address) {
		Song song = songsManager.getSong(_songId);

		return (song.getTotalPrice(_numberOfParts), address(song));
	}

	function buyParts(uint256 _songId, address _buyer, uint256 _numberOfParts) external {
		Song song = songsManager.getSong(_songId);

		song.buyParts(_buyer, _numberOfParts);

		emit SongPurchase(_songId, _buyer, _numberOfParts);
	}

	function isSellOptionAvailable(uint256 _songId) external view returns (bool) {
		Song song = songsManager.getSong(_songId);

		return song.isSellOptionAvailable();
	}

	function sellParts(uint256 _songId, address _seller, uint256 _numberOfParts) external returns (uint256, address) {
		Song song = songsManager.getSong(_songId);

		return (song.sellParts(_seller, _numberOfParts), address(song));
	}

	function preBuyPlay(uint256 _songId) external view returns (uint256, address) {
		Song song = songsManager.getSong(_songId);

		return (song.getPlayFee(), address(song));
	}

	function buyPlay(uint256 _songId, address _listener) external {
		Song song = songsManager.getSong(_songId);

		(address[] memory holders, uint256[] memory amounts) = song.buyPlay(_songId);

		emit SongPlayed(_songId, _listener);

		for (uint256 i = 0; i < holders.length; i++) {
			emit RoyaltyDistributed(_songId, holders[i], amounts[i]);
		}
	}

	function withdrawRoyalties(uint256 _songId, address _holder) external returns (uint256, address) {
		Song song = songsManager.getSong(_songId);

		emit RoyaltiesWithdrawn(_songId, msg.sender);

		return (song.withdrawRoyalties(_holder), address(song));
	}

	function boostSong(uint256 _songId, address _payer) external {
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
