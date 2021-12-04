// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Market for ERC1155 token
/// @author Nazh_G
contract Market is Ownable {

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

    mapping(uint256 => Offer) public offers;
    uint256 public numOffers;

    /// @notice here are stored the ERC20 tokens that can be used to buy
    /// @dev KEY: token address => VALUE AggregatorV3Interface address (to get the price)
    IERC20 paymentToken;

    /// @notice fees will fall here
    address payable private collector;
    uint256 private fee;

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
        address indexed canceller,
        address indexed token,
        uint256 indexed tokenID,
        uint256 time
    );

    /// @dev init PaymentsAllowed, fee and collerctor
    constructor(address wsCHEEZ, address DAO) {
        paymentToken = IERC20(wsCHEEZ);
        collector = payable(DAO);
        fee = 100;
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

    /// @notice mark the offer as not-buyable
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

    /// @notice publishes an offer if you have access to transfer the token
    function MakeOffer(Offer memory _offer) external {
        ERC1155 token = ERC1155(_offer.token);
        require(
            token.isApprovedForAll(msg.sender, address(this)),
            "Approval Needed"
        );
        require(_offer.amount > 0,"Not token to sell");
        uint256 balance = token.balanceOf(msg.sender, _offer.tokenID);
        require(_offer.amount <= balance);
        
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
            numOffers++,
            _offer.admin,
            _offer.token,
            _offer.tokenID,
            _offer.amount,
            _offer.deadline,
            _offer.price
        );
    }

    /// @notice Buy the Offer, sending offers token to a buyer, fee to collector y price to token admin
    function BuyOffer(uint256 offerID, uint256 amount) public payable existOffer(offerID) {
        require(offers[offerID].available,"Offer is not available");
        require(offers[offerID].deadline >= block.timestamp,"Expired offer");
        require(offers[offerID].amount >= amount,"Expired offer");

        ERC1155 token = ERC1155(offers[offerID].token);
        uint256 price = offers[offerID].price * amount;
        uint256 _fee = price / fee;
        
        uint256 fundsAllowance = paymentToken.allowance(msg.sender, address(this));
        require(fundsAllowance >= price, "not enough funds approved");

        paymentToken.transferFrom(msg.sender, collector, _fee);
        paymentToken.transferFrom(msg.sender, offers[offerID].admin, price - _fee);

        token.safeTransferFrom(
            offers[offerID].admin,
            msg.sender,
            offers[offerID].tokenID,
            amount,
            ""
        );
        
        emit Buy(
            offerID,
            msg.sender,
            offers[offerID].token,
            offers[offerID].tokenID,
            amount,
            block.timestamp,
            price,
            _fee
        );
        
        offers[offerID].amount = offers[offerID].amount - amount;
        if(offers[offerID].amount == 0){
            offers[offerID].available = false;
        }
    }

    /// @notice receive token 1155
    function onERC1155Received(address, address, uint256, uint256, bytes memory) external virtual returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

}
