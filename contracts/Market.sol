//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Market is OwnableUpgradeable {
    AggregatorV3Interface internal priceFeed;

    struct Offer {
        address payable admin;
        address token;
        uint256 tokenID;
        uint256 amount;
        uint256 deadline;
        uint256 price; // in usd
    }

    mapping(uint256 => Offer) public offers;
    uint256 public numOffers;

    address payable private collector;
    uint256 fee;

    constructor() {
        __Ownable_init_unchained();

        collector = payable(tx.origin);
        fee = 100;

        //https://docs.chain.link/docs/ethereum-addresses/
        priceFeed = AggregatorV3Interface(
            // ETH / USD     8
            0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
            //USDT / ETH	18  0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46
        );
    }

    modifier existOffer(uint256 offerID) {
        require(offerID < numOffers, "Offer don't exist");
        _;
    }

    function setCollector(address payable _collector) public onlyOwner{
        collector = _collector;
    }

    function setFee(uint256 _fee) public onlyOwner{
        fee = _fee;
    }

    /**
     * Returns the latest price
     */
    function getThePrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    function getTokenPrice(uint256 offerID)
        public
        view
        existOffer(offerID)
        returns (uint256)
    {
        uint256 price =
            uint256((1 ether / offers[offerID].price)) *
                uint256(getThePrice() / 10**8); // are this the best math ?
        return price;
    }

    function MakeOffer(Offer memory _offer) public {
        ERC1155 token = ERC1155(_offer.token);
        require(
            token.isApprovedForAll(msg.sender, address(this)),
            "Approval Needed"
        );
        Offer storage offer = offers[numOffers++];
        // offer = _offer; there is any way to do this pretty
        offer.admin = _offer.admin;
        offer.token = _offer.token;
        offer.tokenID = _offer.tokenID;
        offer.amount = _offer.amount;
        offer.deadline = _offer.deadline;
        offer.price = _offer.price;
    }

    function BuyOffer(uint256 offerID) public payable existOffer(offerID) {
        ERC1155 token = ERC1155(offers[offerID].token);
        uint256 _fee = msg.value / fee; // 1%
        uint256 remaind = msg.value - fee;
        uint256 price = getTokenPrice(offerID);
        require(remaind >= price, "not enough ETH");
        token.safeTransferFrom(
            offers[offerID].admin,
            address(this),
            offers[offerID].tokenID,
            offers[offerID].amount,
            ""
        );
        token.safeTransferFrom(
            address(this),
            msg.sender,
            offers[offerID].tokenID,
            offers[offerID].amount,
            ""
        );
        
        collector.transfer(_fee);
        offers[offerID].admin.transfer(price);
        payable(msg.sender).transfer(address(this).balance);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) public virtual returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

}
