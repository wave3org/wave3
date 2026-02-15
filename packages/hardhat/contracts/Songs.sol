//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract Songs is ERC1155 {
    struct Song {
        uint256 id;
        string name;
        string audioCID;
        uint256 albumId;
    }

    uint256 private nextId;
    mapping(uint256 => Song) public songs;
    
    uint256 public constant TOTAL_SHARES = 100;

    event AddedSong(uint256 indexed id, string name, string audioCID, uint256 indexed albumId);

    constructor() ERC1155("") {}

    function addSong(string memory _name, string memory _audioCID, uint256 _albumId) public returns (uint256) {
        uint256 id = nextId;
        songs[id] = Song({
            id: id,
            name: _name,
            audioCID: _audioCID,
            albumId: _albumId
        });
        
        _mint(msg.sender, id, TOTAL_SHARES, "");
        
        emit AddedSong(id, _name, _audioCID, _albumId);
        nextId++;
        return id;
    }

    function getSong(uint256 _id) public view returns (Song memory) {
        return songs[_id];
    }
}