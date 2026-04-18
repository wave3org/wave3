//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Wave3SmartAccount.sol";

interface IWavecoinPlaybackAuthorizer {
	function authorizePlaybackOperatorFor(address listener, address operator) external;
}

contract Wave3SmartAccountFactory {
	mapping(address => address) private _accountOf;
	IWavecoinPlaybackAuthorizer public immutable wavecoin;

	event SmartAccountCreated(address indexed owner, address indexed account);

	constructor(address wavecoinAddress) {
		wavecoin = IWavecoinPlaybackAuthorizer(wavecoinAddress);
	}

	function createAccount(address owner) external returns (address account) {
		account = _accountOf[owner];
		if (account == address(0)) {
			Wave3SmartAccount smartAccount = new Wave3SmartAccount(owner);
			account = address(smartAccount);
			_accountOf[owner] = account;

			emit SmartAccountCreated(owner, account);
		}

		wavecoin.authorizePlaybackOperatorFor(owner, account);
	}

	function getAccount(address owner) external view returns (address) {
		return _accountOf[owner];
	}
}
