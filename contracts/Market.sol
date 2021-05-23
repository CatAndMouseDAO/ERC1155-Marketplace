//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract Market is OwnableUpgradeable {
    AggregatorV3Interface internal priceFeed;

    struct Offer {
        address payable admin;
        bool available;
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

    event Sell(
        uint256 offerID,
        address indexed admin,
        address indexed token,
        uint256 indexed tokenID,
        uint256 amount,
        uint256 deadline,
        uint256 price
    );
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
        address indexed canceller,
        address indexed token,
        uint256 indexed tokenID,
        uint256 time
    );

    function initialize() external initializer {
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

    function setCollector(address payable _collector) external onlyOwner{
        collector = _collector;
    }

    function setFee(uint256 _fee) external onlyOwner{
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

    function cancelOffer(uint256 offerID)
        external
        existOffer(offerID)
    {
        require(msg.sender == offers[offerID].admin,"Only token creator do that");
        offers[offerID].available = false;
        emit Cancel(
            msg.sender,
            offers[offerID].token,
            offers[offerID].tokenID,
            block.timestamp
        );
    }

    function MakeOffer(Offer memory _offer) external {
        ERC1155 token = ERC1155(_offer.token);
        require(
            token.isApprovedForAll(msg.sender, address(this)),
            "Approval Needed"
        );
        require(_offer.amount > 0,"Not token to sell");
        
        Offer storage offer = offers[numOffers];
        // offer = _offer; there is any way to do this pretty
        offer.admin = _offer.admin;
        offer.token = _offer.token;
        offer.tokenID = _offer.tokenID;
        offer.amount = _offer.amount;
        offer.deadline = _offer.deadline;
        offer.price = _offer.price;
        offer.available = true;

        emit Sell(
            numOffers,
            _offer.admin,
            _offer.token,
            _offer.tokenID,
            _offer.amount,
            _offer.deadline,
            _offer.price
        );
        numOffers++;
    }

    function BuyOffer(uint256 offerID) public payable existOffer(offerID) {
        require(offers[offerID].available,"Offer is not available");
        require(offers[offerID].deadline >= block.timestamp,"Expired offer");
        
        ERC1155 token = ERC1155(offers[offerID].token);
        uint256 price = getTokenPrice(offerID);
        uint256 _fee = price / fee;
        require(msg.value >= price + _fee, "not enough ETH");
        token.safeTransferFrom(
            offers[offerID].admin,
            msg.sender,
            offers[offerID].tokenID,
            offers[offerID].amount,
            ""
        );
        
        emit Buy(
            offerID,
            msg.sender,
            offers[offerID].token,
            offers[offerID].tokenID,
            offers[offerID].amount,
            block.timestamp,
            price,
            _fee
        );
        offers[offerID].available = false;
        collector.transfer(_fee);
        offers[offerID].admin.transfer(price);
        payable(msg.sender).transfer(address(this).balance);
    }

    function onERC1155Received(address, address, uint256, uint256, bytes memory) external virtual returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

}
