//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Albums {
    struct Album {
        uint256 id;
        string name;
        string artist;
        string imageCID;
    }

    uint256 private nextId;
    mapping(uint256 => Album) public albums;

    event AddedAlbum(uint256 indexed id, string name, string artist, string imageCID);

    function addAlbum(string memory _name, string memory _artist, string memory _imageCID) public returns (uint256) {
        uint256 id = nextId;
        albums[id] = Album({
            id: id,
            name: _name,
            artist: _artist,
            imageCID: _imageCID
        });
        emit AddedAlbum(id, _name, _artist, _imageCID);
        nextId++;
        return id;
    }
}