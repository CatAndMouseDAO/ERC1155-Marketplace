// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

pragma solidity ^0.8.0;

/// @title Test token
/// @author Nazh_G
/// @notice this token implements ERC1155 for testing
contract NFT is ERC1155 {
    uint256 public constant GOLD = 0;
    uint256 public constant SILVER = 1;
    uint256 public constant THORS_HAMMER = 2;
    uint256 public constant SWORD = 3;
    uint256 public constant SHIELD = 4;

    constructor()
        ERC1155(
            "https://raw.githubusercontent.com/abcoathup/SampleERC1155/master/api/token/{id}.json"
        )
    {
        _mint(msg.sender, THORS_HAMMER, 1, "");
        _mint(msg.sender, GOLD, 10, "");
        _mint(msg.sender, SILVER, 20, "");
        _mint(msg.sender, SHIELD, 30, "");
        _mint(msg.sender, SWORD, 40, "");
    }

    function mint(uint256 amount) external {
        _mint(msg.sender, GOLD, amount);
        _mint(msg.sender, GOLD, amount);
    }
}
