//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title Wave3SmartAccount
 * @notice Single-owner smart account that executes signed calls and lets a relayer sponsor gas.
 */
contract Wave3SmartAccount is EIP712 {
	bytes32 private constant EXECUTE_TYPEHASH =
		keccak256("Execute(address target,uint256 value,bytes32 dataHash,uint256 nonce,uint256 deadline)");
	bytes32 private constant AUTHORIZE_SESSION_KEY_TYPEHASH =
		keccak256(
			"AuthorizeSessionKey(address sessionKey,address target,bytes4 selector,uint64 validUntil,uint32 maxCalls,uint256 nonce,uint256 deadline)"
		);
	bytes32 private constant REVOKE_SESSION_KEY_TYPEHASH =
		keccak256("RevokeSessionKey(address sessionKey,uint256 nonce,uint256 deadline)");
	bytes32 private constant EXECUTE_SESSION_TYPEHASH =
		keccak256(
			"ExecuteSession(address sessionKey,address target,uint256 value,bytes32 dataHash,uint256 nonce,uint256 deadline)"
		);

	address public immutable owner;
	uint256 public nonce;
	mapping(address => uint256) public sessionNonces;

	struct SessionConfig {
		bool active;
		address target;
		bytes4 selector;
		uint64 validUntil;
		uint32 maxCalls;
		uint32 usedCalls;
	}

	mapping(address => SessionConfig) private _sessions;

	event Executed(address indexed relayer, address indexed target, uint256 value, bytes data, bytes returnData);
	event SessionKeyAuthorized(
		address indexed sessionKey,
		address indexed target,
		bytes4 indexed selector,
		uint64 validUntil,
		uint32 maxCalls
	);
	event SessionKeyRevoked(address indexed sessionKey);
	event SessionExecuted(address indexed relayer, address indexed sessionKey, address indexed target, bytes data);

	error InvalidOwner();
	error InvalidSignature();
	error DeadlineExpired();
	error CallFailed(bytes reason);
	error InvalidSessionKey();
	error InvalidSessionSignature();
	error InvalidSessionConfig();
	error SessionExpired();
	error SessionUsageExceeded();
	error SessionUnauthorizedTarget();
	error SessionUnauthorizedSelector();
	error SessionValueNotAllowed();

	constructor(address _owner) EIP712("Wave3SmartAccount", "1") {
		if (_owner == address(0)) {
			revert InvalidOwner();
		}
		owner = _owner;
	}

	function execute(
		address target,
		uint256 value,
		bytes calldata data,
		uint256 deadline,
		bytes calldata signature
	) external payable returns (bytes memory returnData) {
		if (block.timestamp > deadline) {
			revert DeadlineExpired();
		}

		bytes32 structHash = keccak256(abi.encode(EXECUTE_TYPEHASH, target, value, keccak256(data), nonce, deadline));
		bytes32 digest = _hashTypedDataV4(structHash);
		address signer = ECDSA.recover(digest, signature);

		if (signer != owner) {
			revert InvalidSignature();
		}

		nonce++;

		(bool success, bytes memory result) = target.call{ value: value }(data);
		if (!success) {
			revert CallFailed(result);
		}

		emit Executed(msg.sender, target, value, data, result);
		return result;
	}

	function authorizeSessionKey(
		address sessionKey,
		address target,
		bytes4 selector,
		uint64 validUntil,
		uint32 maxCalls,
		uint256 deadline,
		bytes calldata signature
	) external {
		if (sessionKey == address(0) || target == address(0)) {
			revert InvalidSessionKey();
		}
		if (maxCalls == 0 || validUntil <= block.timestamp) {
			revert InvalidSessionConfig();
		}
		if (block.timestamp > deadline) {
			revert DeadlineExpired();
		}

		bytes32 structHash = keccak256(
			abi.encode(
				AUTHORIZE_SESSION_KEY_TYPEHASH,
				sessionKey,
				target,
				selector,
				validUntil,
				maxCalls,
				nonce,
				deadline
			)
		);
		bytes32 digest = _hashTypedDataV4(structHash);
		address signer = ECDSA.recover(digest, signature);
		if (signer != owner) {
			revert InvalidSignature();
		}

		nonce++;

		_sessions[sessionKey] = SessionConfig({
			active: true,
			target: target,
			selector: selector,
			validUntil: validUntil,
			maxCalls: maxCalls,
			usedCalls: 0
		});
		sessionNonces[sessionKey] = 0;

		emit SessionKeyAuthorized(sessionKey, target, selector, validUntil, maxCalls);
	}

	function revokeSessionKey(address sessionKey, uint256 deadline, bytes calldata signature) external {
		if (sessionKey == address(0)) {
			revert InvalidSessionKey();
		}
		if (block.timestamp > deadline) {
			revert DeadlineExpired();
		}

		bytes32 structHash = keccak256(abi.encode(REVOKE_SESSION_KEY_TYPEHASH, sessionKey, nonce, deadline));
		bytes32 digest = _hashTypedDataV4(structHash);
		address signer = ECDSA.recover(digest, signature);
		if (signer != owner) {
			revert InvalidSignature();
		}

		nonce++;

		_sessions[sessionKey].active = false;

		emit SessionKeyRevoked(sessionKey);
	}

	function executeSession(
		address sessionKey,
		address target,
		uint256 value,
		bytes calldata data,
		uint256 deadline,
		bytes calldata sessionSignature
	) external payable returns (bytes memory returnData) {
		SessionConfig storage session = _sessions[sessionKey];
		_validateExecuteSession(session, target, value, data, deadline);
		uint256 sessionNonce = _verifyExecuteSessionSignature(
			sessionKey,
			target,
			value,
			data,
			deadline,
			sessionSignature
		);

		_consumeSessionCall(session, sessionKey, sessionNonce);
		bytes memory result = _callTarget(target, data);

		emit SessionExecuted(msg.sender, sessionKey, target, data);
		return result;
	}

	function _validateExecuteSession(
		SessionConfig storage session,
		address target,
		uint256 value,
		bytes calldata data,
		uint256 deadline
	) internal view {
		if (value != 0) {
			revert SessionValueNotAllowed();
		}
		if (block.timestamp > deadline) {
			revert DeadlineExpired();
		}
		if (!session.active) {
			revert InvalidSessionKey();
		}
		if (block.timestamp > session.validUntil) {
			revert SessionExpired();
		}
		if (session.usedCalls >= session.maxCalls) {
			revert SessionUsageExceeded();
		}
		if (target != session.target) {
			revert SessionUnauthorizedTarget();
		}

		if (_extractSelector(data) != session.selector) {
			revert SessionUnauthorizedSelector();
		}
	}

	function _extractSelector(bytes calldata data) internal pure returns (bytes4 selector) {
		if (data.length < 4) {
			revert SessionUnauthorizedSelector();
		}
		assembly {
			selector := calldataload(data.offset)
		}
	}

	function _buildExecuteSessionStructHash(
		address sessionKey,
		address target,
		uint256 value,
		bytes calldata data,
		uint256 sessionNonce,
		uint256 deadline
	) internal pure returns (bytes32) {
		return
			keccak256(
				abi.encode(EXECUTE_SESSION_TYPEHASH, sessionKey, target, value, keccak256(data), sessionNonce, deadline)
			);
	}

	function _verifyExecuteSessionSignature(
		address sessionKey,
		address target,
		uint256 value,
		bytes calldata data,
		uint256 deadline,
		bytes calldata sessionSignature
	) internal view returns (uint256 sessionNonce) {
		sessionNonce = sessionNonces[sessionKey];
		bytes32 structHash = _buildExecuteSessionStructHash(sessionKey, target, value, data, sessionNonce, deadline);
		bytes32 digest = _hashTypedDataV4(structHash);
		address signer = ECDSA.recover(digest, sessionSignature);
		if (signer != sessionKey) {
			revert InvalidSessionSignature();
		}
	}

	function _consumeSessionCall(SessionConfig storage session, address sessionKey, uint256 sessionNonce) internal {
		session.usedCalls += 1;
		sessionNonces[sessionKey] = sessionNonce + 1;
	}

	function _callTarget(address target, bytes calldata data) internal returns (bytes memory result) {
		(bool success, bytes memory callResult) = target.call(data);
		if (!success) {
			revert CallFailed(callResult);
		}
		result = callResult;
	}

	function getSession(address sessionKey) external view returns (SessionConfig memory) {
		return _sessions[sessionKey];
	}

	/**
	 * @notice ERC1155 token receiver - allows the smart account to hold ERC1155 tokens
	 */
	function onERC1155Received(
		address operator,
		address from,
		uint256 id,
		uint256 value,
		bytes calldata data
	) external pure returns (bytes4) {
		return this.onERC1155Received.selector;
	}

	/**
	 * @notice ERC1155 batch token receiver - allows the smart account to hold batches of ERC1155 tokens
	 */
	function onERC1155BatchReceived(
		address operator,
		address from,
		uint256[] calldata ids,
		uint256[] calldata values,
		bytes calldata data
	) external pure returns (bytes4) {
		return this.onERC1155BatchReceived.selector;
	}

	receive() external payable {}
}
