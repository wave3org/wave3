//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Albums {
    struct Album {
        uint256 id;
        string name;
        string artist;
        string imageCID;
        uint256[] songIds;
    }

    uint256 private nextId;
    mapping(uint256 => Album) public albums;

    function addAlbum(string memory _name, string memory _artist, string memory _imageCID) public returns (uint256) {
        uint256 id = nextId;
        albums[id] = Album({
            id: id,
            name: _name,
            artist: _artist,
            imageCID: _imageCID,
            songIds: new uint256[](0)
        });
        nextId++;
        return id;
    }

    function addSongToAlbum(uint256 _albumId, uint256 _songId) public {
        albums[_albumId].songIds.push(_songId);
    }
}