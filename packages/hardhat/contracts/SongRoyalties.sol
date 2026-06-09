//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SongRoyalties is ERC1155Supply {
	uint256 private constant PRECISION = 1e18;
	uint256 public constant FEE_PERCENTAGE = 30;

	struct SongRoyalty {
		address artist;
		uint256 buyPrice;
		uint256 totalParts;
		uint256 nonSellableParts;
		uint256 availableParts;
		uint256 playFee;
		uint256 accRevenuePerPart;
		bool exists;
	}

	IERC20 private immutable wavecoin;
	address private immutable songsModel;
	address private immutable feeRecipient;

	mapping(uint256 => SongRoyalty) private royalties;
	mapping(uint256 => mapping(address => uint256)) private rewardDebt;
	mapping(uint256 => mapping(address => uint256)) private accruedRoyalties;

	event SongSharesCreated(
		uint256 indexed songId,
		address indexed artist,
		uint256 totalParts,
		uint256 nonSellableParts,
		uint256 buyPrice,
		uint256 playFee
	);
	event PrimaryPartsSold(uint256 indexed songId, address indexed buyer, uint256 parts, uint256 totalPrice);
	event RevenueRecorded(uint256 indexed songId, uint256 amount);
	event RoyaltiesClaimed(uint256 indexed songId, address indexed holder, uint256 amount, uint256 fee);
	event SharesTransferred(uint256 indexed songId, address indexed from, address indexed to, uint256 parts);

	modifier onlySongsModel() {
		require(msg.sender == songsModel, "Only songs model");
		_;
	}

	constructor(IERC20 _wavecoin, address _songsModel, address _feeRecipient) ERC1155("") {
		require(address(_wavecoin) != address(0), "Invalid wavecoin");
		require(_songsModel != address(0), "Invalid songs model");
		require(_feeRecipient != address(0), "Invalid fee recipient");

		wavecoin = _wavecoin;
		songsModel = _songsModel;
		feeRecipient = _feeRecipient;
	}

	function createSongShares(
		uint256 _songId,
		address _artist,
		uint256 _buyPrice,
		uint256 _totalParts,
		uint256 _nonSellableParts,
		uint256 _playFee
	) external onlySongsModel {
		require(!royalties[_songId].exists, "Song royalties already exist");
		require(_artist != address(0), "Invalid artist");
		require(_totalParts > 0, "Total parts must be greater than zero");
		require(_nonSellableParts <= _totalParts, "Invalid non sellable parts");

		royalties[_songId] = SongRoyalty({
			artist: _artist,
			buyPrice: _buyPrice,
			totalParts: _totalParts,
			nonSellableParts: _nonSellableParts,
			availableParts: _totalParts - _nonSellableParts,
			playFee: _playFee,
			accRevenuePerPart: 0,
			exists: true
		});

		_mint(_artist, _songId, _totalParts, "");
		rewardDebt[_songId][_artist] = (_totalParts * royalties[_songId].accRevenuePerPart) / PRECISION;

		emit SongSharesCreated(_songId, _artist, _totalParts, _nonSellableParts, _buyPrice, _playFee);
	}

	function getPartPrice(uint256 _songId) external view returns (uint256) {
		return royalties[_songId].buyPrice;
	}

	function getBuyPrice(uint256 _songId) external view returns (uint256) {
		return royalties[_songId].buyPrice;
	}

	function getTotalParts(uint256 _songId) external view returns (uint256) {
		return royalties[_songId].totalParts;
	}

	function getAvailableParts(uint256 _songId) external view returns (uint256) {
		return royalties[_songId].availableParts;
	}

	function getPlayFee(uint256 _songId) external view returns (uint256) {
		return royalties[_songId].playFee;
	}

	function getTotalPrice(uint256 _songId, uint256 _numberOfParts) external view returns (uint256) {
		SongRoyalty storage royalty = royalties[_songId];
		require(royalty.exists, "Song royalties do not exist");
		require(royalty.availableParts >= _numberOfParts, "Not enough parts available");

		return _numberOfParts * royalty.buyPrice;
	}

	function buyParts(uint256 _songId, address _buyer, uint256 _numberOfParts) external onlySongsModel {
		SongRoyalty storage royalty = royalties[_songId];
		require(royalty.exists, "Song royalties do not exist");
		require(_buyer != address(0), "Invalid buyer");
		require(_numberOfParts > 0, "Parts must be greater than zero");
		require(royalty.availableParts >= _numberOfParts, "Not enough parts available");

		uint256 totalPrice = _numberOfParts * royalty.buyPrice;

		royalty.availableParts -= _numberOfParts;
		_safeTransferFrom(royalty.artist, _buyer, _songId, _numberOfParts, "");
		accruedRoyalties[_songId][royalty.artist] += totalPrice;

		emit PrimaryPartsSold(_songId, _buyer, _numberOfParts, totalPrice);
	}

	function recordRevenue(uint256 _songId, uint256 _amount) external onlySongsModel {
		SongRoyalty storage royalty = royalties[_songId];
		require(royalty.exists, "Song royalties do not exist");
		require(_amount > 0, "Revenue must be greater than zero");

		royalty.accRevenuePerPart += (_amount * PRECISION) / royalty.totalParts;

		emit RevenueRecorded(_songId, _amount);
	}

	function pendingRoyalties(uint256 _songId, address _holder) public view returns (uint256) {
		SongRoyalty storage royalty = royalties[_songId];
		uint256 accumulated = (balanceOf(_holder, _songId) * royalty.accRevenuePerPart) / PRECISION;

		return accruedRoyalties[_songId][_holder] + accumulated - rewardDebt[_songId][_holder];
	}

	function pendingRoyaltiesMany(
		uint256[] calldata _songIds,
		address _holder
	) external view returns (uint256[] memory amounts, uint256 total, uint256 claimableTotal) {
		require(_holder != address(0), "Invalid holder");

		amounts = new uint256[](_songIds.length);

		for (uint256 i = 0; i < _songIds.length; i++) {
			uint256 amount = pendingRoyalties(_songIds[i], _holder);
			amounts[i] = amount;
			total += amount;
			claimableTotal += amount - ((amount * FEE_PERCENTAGE) / 100);
		}
	}

	function withdraw(uint256 _songId, address _holder) external onlySongsModel returns (uint256) {
		require(_holder != address(0), "Invalid holder");

		_settle(_songId, _holder);

		uint256 amount = accruedRoyalties[_songId][_holder];
		require(amount > 0, "Holder has no royalties to withdraw");

		accruedRoyalties[_songId][_holder] = 0;

		uint256 fee = (amount * FEE_PERCENTAGE) / 100;
		uint256 holderAmount = amount - fee;

		if (fee > 0) {
			require(wavecoin.transfer(feeRecipient, fee), "Fee transfer failed");
		}

		require(wavecoin.transfer(_holder, holderAmount), "Royalty transfer failed");

		emit RoyaltiesClaimed(_songId, _holder, holderAmount, fee);

		return holderAmount;
	}

	function withdrawMany(uint256[] calldata _songIds, address _holder) external onlySongsModel returns (uint256) {
		require(_holder != address(0), "Invalid holder");
		require(_songIds.length > 0, "No songs provided");

		uint256 totalFee = 0;
		uint256 totalHolderAmount = 0;

		for (uint256 i = 0; i < _songIds.length; i++) {
			uint256 songId = _songIds[i];
			_settle(songId, _holder);

			uint256 amount = accruedRoyalties[songId][_holder];
			if (amount == 0) {
				continue;
			}

			accruedRoyalties[songId][_holder] = 0;

			uint256 fee = (amount * FEE_PERCENTAGE) / 100;
			uint256 holderAmount = amount - fee;

			totalFee += fee;
			totalHolderAmount += holderAmount;

			emit RoyaltiesClaimed(songId, _holder, holderAmount, fee);
		}

		require(totalHolderAmount > 0, "Holder has no royalties to withdraw");

		if (totalFee > 0) {
			require(wavecoin.transfer(feeRecipient, totalFee), "Fee transfer failed");
		}

		require(wavecoin.transfer(_holder, totalHolderAmount), "Royalty transfer failed");

		return totalHolderAmount;
	}

	function _settle(uint256 _songId, address _holder) private {
		if (_holder == address(0) || !royalties[_songId].exists) {
			return;
		}

		uint256 accumulated = (balanceOf(_holder, _songId) * royalties[_songId].accRevenuePerPart) / PRECISION;
		uint256 debt = rewardDebt[_songId][_holder];

		if (accumulated > debt) {
			accruedRoyalties[_songId][_holder] += accumulated - debt;
		}

		rewardDebt[_songId][_holder] = accumulated;
	}

	function _update(
		address from,
		address to,
		uint256[] memory ids,
		uint256[] memory values
	) internal override {
		for (uint256 i = 0; i < ids.length; i++) {
			if (values[i] > 0) {
				_settle(ids[i], from);
				_settle(ids[i], to);
			}
		}

		super._update(from, to, ids, values);

		for (uint256 i = 0; i < ids.length; i++) {
			if (values[i] > 0 && royalties[ids[i]].exists) {
				if (from != address(0)) {
					rewardDebt[ids[i]][from] =
						(balanceOf(from, ids[i]) * royalties[ids[i]].accRevenuePerPart) /
						PRECISION;
				}
				if (to != address(0)) {
					rewardDebt[ids[i]][to] =
						(balanceOf(to, ids[i]) * royalties[ids[i]].accRevenuePerPart) /
						PRECISION;
				}

				emit SharesTransferred(ids[i], from, to, values[i]);
			}
		}
	}
}
