//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

interface ISongs {
    struct Song {
        uint256 id;
        string name;
        string audioCID;
        uint256 albumId;
    }
    function getSong(uint256 id) external view returns (Song memory);
    function TOTAL_SHARES() external view returns (uint256);
}

contract SongRoyalties {
    IERC20 public immutable wavecoin;
    ISongs public immutable songsContract;
    IERC1155 public immutable songsNFT;
    
    uint256 public constant PLAYBACK_FEE = 1 ether; // 1 WAVE per play
    
    mapping(uint256 => uint256) public songRoyalties;
    
    event SongPlayed(uint256 indexed songId, address indexed listener);
    event RoyaltiesWithdrawn(uint256 indexed songId, address indexed shareholder, uint256 amount);
    event SharesPurchased(uint256 indexed songId, address indexed buyer, address indexed seller, uint256 shares, uint256 totalPrice);
    
    constructor(address _wavecoin, address _songsContract) {
        wavecoin = IERC20(_wavecoin);
        songsContract = ISongs(_songsContract);
        songsNFT = IERC1155(_songsContract);
    }
    
    function playSong(uint256 songId) external {
        ISongs.Song memory song = songsContract.getSong(songId);
        require(song.id == songId, "Song does not exist");
        
        require(wavecoin.transferFrom(msg.sender, address(this), PLAYBACK_FEE), "Transfer failed");
        
        songRoyalties[songId] += PLAYBACK_FEE;
        
        emit SongPlayed(songId, msg.sender);
    }
    
    function withdrawRoyalties(uint256 songId) external {
        uint256 shares = songsNFT.balanceOf(msg.sender, songId);
        require(shares > 0, "No shares");
        
        uint256 totalRoyalties = songRoyalties[songId];
        uint256 totalShares = songsContract.TOTAL_SHARES();
        uint256 amount = (totalRoyalties * shares) / totalShares;
        
        require(amount > 0, "No royalties");
        
        songRoyalties[songId] -= amount;
        
        require(wavecoin.transfer(msg.sender, amount), "Transfer failed");
        
        emit RoyaltiesWithdrawn(songId, msg.sender, amount);
    }
    
    function buyShares(uint256 songId, address seller, uint256 shares) external {
        require(shares > 0, "Shares must be > 0");
        require(songsNFT.balanceOf(seller, songId) >= shares, "Seller doesn't have enough shares");
        
        uint256 totalRoyalties = songRoyalties[songId];
        uint256 totalShares = songsContract.TOTAL_SHARES();
        uint256 totalPrice = (totalRoyalties * shares) / totalShares;
        
        require(wavecoin.transferFrom(msg.sender, seller, totalPrice), "Payment failed");
        
        songsNFT.safeTransferFrom(seller, msg.sender, songId, shares, "");
        
        emit SharesPurchased(songId, msg.sender, seller, shares, totalPrice);
    }
}
