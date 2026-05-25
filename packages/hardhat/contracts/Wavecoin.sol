//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./SongsModel.sol";

interface IWave3SmartAccountFactory {
	function getAccount(address owner) external view returns (address);
}

contract Wavecoin is ERC20 {
 	uint256 private constant FEE_PERCENTAGE = 30;

	address private owner;
	address public treasury;
	address public smartAccountFactory;

	SongsModel private songsModel;
	mapping(address => mapping(address => bool)) public approvedPlaybackOperators;

	constructor(address _owner, address _treasury, SongsModel _songsModel) ERC20("Wavecoin", "WAVE") {
		require(_treasury != address(0), "Invalid treasury");
		owner = _owner;
		treasury = _treasury;
		songsModel = _songsModel;
	}

	modifier onlyOwner() {
		require(msg.sender == owner, "Only owner");
		_;
	}

	modifier onlySmartAccountFactory() {
		require(msg.sender == smartAccountFactory, "Only smart account factory");
		_;
	}

	function setSmartAccountFactory(address _smartAccountFactory) external onlyOwner {
		require(_smartAccountFactory != address(0), "Invalid factory");
		smartAccountFactory = _smartAccountFactory;
	}

	function setApprovedPlaybackOperator(address operator, bool approved) external {
		require(operator != address(0), "Invalid operator");
		approvedPlaybackOperators[msg.sender][operator] = approved;
	}

	function authorizePlaybackOperatorFor(address listener, address operator) external onlySmartAccountFactory {
		require(listener != address(0), "Invalid listener");
		require(operator != address(0), "Invalid operator");
		require(IWave3SmartAccountFactory(smartAccountFactory).getAccount(listener) == operator, "Unexpected operator");
		approvedPlaybackOperators[listener][operator] = true;
	}

	function mint(uint256 amount) public {
		_mint(msg.sender, amount);
	}

	function buyParts(uint256 _songId, uint256 _numberOfParts) public {
		(uint256 totalPrice, address songOwner) = songsModel.preBuyParts(_songId, _numberOfParts);

		require(balanceOf(msg.sender) >= totalPrice, "Insufficient funds");

		transfer(songOwner, totalPrice);

		songsModel.buyParts(_songId, msg.sender, _numberOfParts);
	}

	function sellParts(uint256 _songId, uint256 _numberOfParts) public {
		(uint256 totalAmount, address songAddress) = songsModel.sellParts(_songId, msg.sender, _numberOfParts);

		transferFrom(songAddress, msg.sender, totalAmount);
	}

	function buyPlay(uint256 _songId) public {
		buyPlayFor(_songId, msg.sender);
	}

	function buyPlayFor(uint256 _songId, address listener) public {
		require(listener != address(0), "Invalid listener");
		require(
			msg.sender == listener || approvedPlaybackOperators[listener][msg.sender],
			"Not authorized"
		);

		(uint256 price, address songAddress) = songsModel.preBuyPlay(_songId);

		require(balanceOf(listener) > price, "Insufficient funds");

		_transfer(listener, songAddress, price);

		songsModel.buyPlay(_songId, listener);
	}

	function withdrawRoyalties(uint256 _songId) public {
		(uint256 amount, address songAddress) = songsModel.withdrawRoyalties(_songId, msg.sender);
		uint256 fee = (amount * FEE_PERCENTAGE) / 100;

		transferFrom(songAddress, owner, fee);

		transferFrom(songAddress, msg.sender, amount - fee);
	}

	function boostSong(uint256 _songId) public {
		uint256 price = songsModel.BOOST_PRICE();
		require(balanceOf(msg.sender) >= price, "Insufficient funds");
		transfer(treasury, price);
		songsModel.boostSong(_songId, msg.sender);
	}
}
