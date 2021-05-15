//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./interfaces/AggregatorV3Interface.sol";

contract Market {
    AggregatorV3Interface internal priceFeed;

    constructor() {
        //https://docs.chain.link/docs/ethereum-addresses/
        priceFeed = AggregatorV3Interface(
            0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
        );
    }

    /**
     * Returns the latest price
     */
    function getThePrice() public view returns (int256) {
        // uint80 roundID,
        // int256 price,
        // uint256 startedAt,
        // uint256 timeStamp,
        // uint80 answeredInRound
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}
