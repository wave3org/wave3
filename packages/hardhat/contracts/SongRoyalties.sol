//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IAlbums {
    struct Album {
        uint256 id;
        string name;
        address artist;
        string imageCID;
    }
    function getAlbum(uint256 id) external view returns (Album memory);
}

interface ISongs {
    struct Song {
        uint256 id;
        string name;
        string audioCID;
        uint256 albumId;
    }
    function getSong(uint256 id) external view returns (Song memory);
}

contract SongRoyalties {
    IERC20 public immutable wavecoin;
    IAlbums public immutable albumsContract;
    ISongs public immutable songsContract;
    
    uint256 public constant PLAYBACK_FEE = 1 ether; // 1 WAVE per play
    
    mapping(address => uint256) public artistRoyalties;
    
    event SongPlayed(uint256 indexed songId, address indexed listener, address indexed artist);
    event RoyaltiesWithdrawn(address indexed artist, uint256 amount);
    
    constructor(address _wavecoin, address _albumsContract, address _songsContract) {
        wavecoin = IERC20(_wavecoin);
        albumsContract = IAlbums(_albumsContract);
        songsContract = ISongs(_songsContract);
    }
    
    function playSong(uint256 songId) external {
        ISongs.Song memory song = songsContract.getSong(songId);
        require(song.id == songId, "Song does not exist");
        
        IAlbums.Album memory album = albumsContract.getAlbum(song.albumId);
        
        require(wavecoin.transferFrom(msg.sender, address(this), PLAYBACK_FEE), "Transfer failed");
        
        artistRoyalties[album.artist] += PLAYBACK_FEE;
        
        emit SongPlayed(songId, msg.sender, album.artist);
    }
    
    function withdrawRoyalties() external {
        uint256 amount = artistRoyalties[msg.sender];
        require(amount > 0, "No royalties");
        
        artistRoyalties[msg.sender] = 0;
        
        require(wavecoin.transfer(msg.sender, amount), "Transfer failed");
        
        emit RoyaltiesWithdrawn(msg.sender, amount);
    }
}
