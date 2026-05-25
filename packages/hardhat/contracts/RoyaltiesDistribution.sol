//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract RoyaltiesDistribution {
	uint256 private partPrice;

	uint256 private totalParts;

	uint256 private nonSellableParts;

	uint256 private availableParts;

	address[] private holders;

	mapping(address => uint) private parts;

	mapping(address => uint) private balances;

	mapping(address => bool) private alreadyHolds;

	event RoyaltyDistributed(uint256 indexed songId, address indexed holder, uint256 amount);

	constructor(address _owner, uint256 _partPrice, uint256 _totalParts, uint256 _nonSellableParts) {
		partPrice = _partPrice;
		totalParts = _totalParts;
		nonSellableParts = _nonSellableParts;
		availableParts = _totalParts - _nonSellableParts;
		alreadyHolds[_owner] = true;
		parts[_owner] = _totalParts;
		balances[_owner] = 0;
		holders.push(_owner);
	}

	function getPartPrice() external view returns (uint256) {
		return partPrice;
	}

	function getTotalParts() external view returns (uint256) {
		return totalParts;
	}

	function getAvailableParts() external view returns (uint256) {
		return availableParts;
	}

	function getTotalPrice(uint256 _numberOfParts) external view returns (uint256) {
		require(availableParts >= _numberOfParts, "Not enough parts available");

		return _numberOfParts * partPrice;
	}

	function buyParts(address _buyer, uint256 _numberOfParts) external {
		require(availableParts >= _numberOfParts, "Not enough parts available");

		address owner = holders[0];

		if (alreadyHolds[_buyer]) {
			parts[_buyer] = parts[_buyer] + _numberOfParts;
		} else {
			alreadyHolds[_buyer] = true;
			parts[_buyer] = _numberOfParts;
			balances[_buyer] = 0;
			holders.push(_buyer);
		}

		parts[owner] = parts[owner] - _numberOfParts;
		availableParts = availableParts - _numberOfParts;
	}

	function isSellOptionAvailable() public view returns (bool) {
		return balances[holders[0]] > getMinimiumFundsRequired();
	}

	function getMinimiumFundsRequired() private view returns (uint256) {
		return ((totalParts - nonSellableParts - availableParts) * partPrice);
	}

	function sellParts(address _seller, uint256 _numberOfParts) external returns (uint256){
		require(alreadyHolds[_seller] == true, "Seller does not hold any parts of this song");
		require(isSellOptionAvailable(), "Sell option nor available");

		address owner = holders[0];

		parts[_seller] = parts[_seller] - _numberOfParts;

		parts[owner] = parts[owner] + _numberOfParts;

		availableParts = availableParts + _numberOfParts;

		return (partPrice * _numberOfParts);
	}

	function distributeRevenue(uint256 _amount, uint256 _songId) external returns (address[] memory, uint256[] memory) {
		address[] memory holdersOut = new address[](holders.length);
		uint256[] memory amounts = new uint256[](holders.length);
		for (uint256 i = 0; i < holders.length; i++) {
			address holder = holders[i];
			uint256 share = (_amount / totalParts) * parts[holder];
			balances[holder] = balances[holder] + share;
			emit RoyaltyDistributed(_songId, holder, share);
			holdersOut[i] = holder;
			amounts[i] = share;
		}
		return (holdersOut, amounts);
	}

	function getPendingBalance(address _holder) external view returns (uint256) {
		if (!alreadyHolds[_holder]) return 0;
		return balances[_holder];
	}

	function withdraw(address _holder) external returns (uint256) {
		require(alreadyHolds[_holder] == true, "Sender does not hold any parts of this song");
		require(balances[_holder] > 0, "Holder has no royalties to withdraw");

		uint256 withdrawnBalance = balances[_holder];

		if (_holder == holders[0]) {
			require(isSellOptionAvailable(), "Owner cannot withdraw royalties unless there are enough funds to cover parts buyback");

			withdrawnBalance = withdrawnBalance - getMinimiumFundsRequired();
		}

		balances[_holder] = balances[_holder] - withdrawnBalance;

		return withdrawnBalance;
	}
}
