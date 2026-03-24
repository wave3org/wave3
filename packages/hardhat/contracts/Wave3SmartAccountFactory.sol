//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "./Wave3SmartAccount.sol";

contract Wave3SmartAccountFactory {
	mapping(address => address) private _accountOf;

	event SmartAccountCreated(address indexed owner, address indexed account);

	function createAccount(address owner) external returns (address account) {
		account = _accountOf[owner];
		if (account != address(0)) {
			return account;
		}

		Wave3SmartAccount smartAccount = new Wave3SmartAccount(owner);
		account = address(smartAccount);
		_accountOf[owner] = account;

		emit SmartAccountCreated(owner, account);
	}

	function getAccount(address owner) external view returns (address) {
		return _accountOf[owner];
	}
}
