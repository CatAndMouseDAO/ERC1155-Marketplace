// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

contract IMarket is Ownable {
    /// @notice the offers has the token that can be bought
    /// @dev price is in USD
    /// @dev deadline is a TIMESTAMP
    struct Offer {
        address payable admin;
        bool available;
        address token;
        uint256 tokenID;
        uint256 amount;
        uint256 deadline;
        uint256 price;
    }

    /// @notice admin is who publish
    event Sell(
        uint256 offerID,
        address indexed admin,
        address indexed token,
        uint256 indexed tokenID,
        uint256 amount,
        uint256 deadline,
        uint256 price
    );

        /// @notice deadline is the moment when was buy
    event Buy(
        uint256 offerID,
        address indexed buyer,
        address indexed token,
        uint256 indexed tokenID,
        uint256 amount,
        uint256 deadline,
        uint256 price,
        uint256 fee
    );

    event Cancel(
        uint256 offerID,
        address indexed canceller,
        address indexed token,
        uint256 indexed tokenID,
        uint256 time
    );



}