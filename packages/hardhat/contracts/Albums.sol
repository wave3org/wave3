//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

contract Albums {
    struct Album {
        uint256 id;
        string name;
        address artist;
        string imageCID;
    }

    uint256 private nextId;
    mapping(uint256 => Album) public albums;

    event AddedAlbum(uint256 indexed id, string name, address indexed artist, string imageCID);

    function addAlbum(string memory _name, string memory _imageCID) public returns (uint256) {
        uint256 id = nextId;
        albums[id] = Album({
            id: id,
            name: _name,
            artist: msg.sender,
            imageCID: _imageCID
        });
        emit AddedAlbum(id, _name, msg.sender, _imageCID);
        nextId++;
        return id;
    }

    function getAlbum(uint256 _id) public view returns (Album memory) {
        return albums[_id];
    }
}