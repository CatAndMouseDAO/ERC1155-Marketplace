//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./interfaces/AggregatorV3Interface.sol";

contract Market {
    AggregatorV3Interface internal priceFeed;

    constructor() {
        //https://docs.chain.link/docs/ethereum-addresses/
        priceFeed = AggregatorV3Interface(
            // ETH / USD     8
            0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
            //USDT / ETH	18	0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46
        );
    }

    /**
     * Returns the latest price
     */
    function getThePrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
}
