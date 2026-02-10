//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Songs {
    struct Song {
        uint256 id;
        string name;
        string audioCID;
    }

    uint256 private nextId;
    mapping(uint256 => Song) public songs;

    function addSong(string memory _name, string memory _audioCID) public returns (uint256) {
        uint256 id = nextId;
        songs[id] = Song({
            id: id,
            name: _name,
            audioCID: _audioCID
        });
        nextId++;
        return id;
    }
}