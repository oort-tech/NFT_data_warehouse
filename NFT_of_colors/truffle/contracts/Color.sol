// This code is licensed under the MIT license
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Color is ERC721Enumerable {
    constructor() ERC721("Unique Colors", "UCO") {}

    mapping(string => bool) private _colorExists;
    string[] public mintedColors;

    function mint(string memory _color) public {
        require(
            !_colorExists[_color],
            "The corresponding color of this hexadecimal code already exists!"
        );
        mintedColors.push(_color);
        uint256 _id = mintedColors.length - 1;
        _mint(msg.sender, _id);
        _colorExists[_color] = true;
    }

    function getMintedColors() public view returns (string[] memory) {
        return mintedColors;
    }
}
