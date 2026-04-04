//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./SongsModel.sol";

contract Wavecoin is ERC20 {
	SongsModel private songsModel;

	constructor(SongsModel _songsModel) ERC20("Wavecoin", "WAVE") {
		songsModel = _songsModel;
	}

	function mint(uint256 amount) public {
		_mint(msg.sender, amount);
	}

	function buyParts(uint256 _songId, uint256 _numberOfParts) public {
		(uint256 totalPrice, address songAddress) = songsModel.preBuyParts(_songId, _numberOfParts);

		require(balanceOf(msg.sender) >= totalPrice, "Insufficient funds");

		transfer(songAddress, totalPrice);

		songsModel.buyParts(_songId, msg.sender, _numberOfParts);
	}

	function buyPlay(uint256 _songId) public {
		(uint256 price, address songAddress) = songsModel.preBuyPlay(_songId);

		require(balanceOf(msg.sender) > price, "Insufficient funds");

		transfer(songAddress, price);

		songsModel.buyPlay(_songId, msg.sender);
	}

	function withdrawRoyalties(uint256 _songId) public {
		(uint256 amount, address songAddress) = songsModel.withdrawRoyalties(_songId, msg.sender);

		transferFrom(songAddress, msg.sender, amount);
	}
}
