//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Wavecoin.sol";
import "./SongsModel.sol";

contract SongsFactory {
	Wavecoin private wavecoin;

	SongsModel private songsModel;

	constructor(Wavecoin _wavecoin, SongsModel _songsModel) {
		wavecoin = _wavecoin;
		songsModel = _songsModel;
	}

	function addAlbum(string memory _name, string memory _artist, string memory _imageCID, string memory _genre, uint256 _year) public returns (uint256) {
		return songsModel.addAlbum(msg.sender, _name, _artist, _imageCID, _genre, _year);
	}

	function addSong(
		string memory _name,
		string memory _audioCID,
		uint256 _albumId,
		uint256 _playFee,
		uint256 _partPrice,
		uint256 _totalParts,
		uint256 _nonSellableParts,
		Wavecoin _wavecoin
	) public returns (uint256) {
		return
			songsModel.addSong(
				msg.sender,
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
}
