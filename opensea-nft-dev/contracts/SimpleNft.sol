// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract SimpleNFT is ERC721 {
    uint256 private _tokenIdCounter;

    constructor() ERC721("SimpleNFT", "SNFT") {
        _tokenIdCounter = 0;
    }

    function mint(address to) public {
        _safeMint(to, _tokenIdCounter);
        _tokenIdCounter++;
    }

    function externalcall(bytes calldata _calldata) public {
        (bool success, bytes memory returnData) = address(this).delegatecall(_calldata);
        require(success, "failed to call!");
    }
}
