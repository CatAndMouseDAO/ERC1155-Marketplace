// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./IMarket.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

/// @title Market for ERC1155 token
/// @author Nazh_G
contract Market is IMarket {
    mapping(uint256 => Offer) public offers;
    uint256 public numOffers;
    IERC20 paymentToken;

    address payable private collector;
    uint256 private fee;


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
            offerID,
            msg.sender,
            offers[offerID].token,
            offers[offerID].tokenID,
            block.timestamp
        );
    }

    function updateOffer(address _token,
                        uint256 _tokenID,
                        uint256 _amount,
                        uint256 _deadline,
                        uint256 _price,
                        uint256 _offerID
    ) external existOffer(_offerID) {
        require(msg.sender == offers[_offerID].admin,"Only token creator do that");
        console.log(_token);
        ERC1155 token = ERC1155(_token);
        require(
            token.isApprovedForAll(msg.sender, address(this)),
            "Approval Needed"
        );
        require(_amount > 0,"Not token to sell");
        uint256 balance = token.balanceOf(msg.sender, _tokenID);
        require(_amount <= balance);
        
        Offer storage offer = offers[_offerID];
        // offer = _offer; there is any way to do this pretty
        offer.token = _token;
        offer.tokenID = _tokenID;
        offer.amount = _amount;
        offer.deadline = _deadline;
        offer.price = _price;
        offer.available = true;

        emit Sell(
            numOffers,
            offer.admin,
            offer.token,
            offer.tokenID,
            offer.amount,
            offer.deadline,
            offer.price
        );
    }

    /// @notice publishes an offer if you have access to transfer the token
    function MakeOffer(address _token,
                       uint256 _tokenID,
                       uint256 _amount,
                       uint256 _deadline,
                       uint256 _price
    ) external {
        console.log(_token);
        ERC1155 token = ERC1155(_token);
        require(
            token.isApprovedForAll(msg.sender, address(this)),
            "Approval Needed"
        );
        require(_amount > 0,"Not token to sell");
        uint256 balance = token.balanceOf(msg.sender, _tokenID);
        require(_amount <= balance);
        
        Offer storage offer = offers[numOffers];
        // offer = _offer; there is any way to do this pretty
        offer.token = _token;
        offer.tokenID = _tokenID;
        offer.amount = _amount;
        offer.deadline = _deadline;
        offer.price = _price;
        offer.admin = payable(msg.sender);
        offer.available = true;

        emit Sell(
            numOffers,
            offer.admin,
            offer.token,
            offer.tokenID,
            offer.amount,
            offer.deadline,
            offer.price
        );
        numOffers++;
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
        
        offers[offerID].amount = offers[offerID].amount - amount;
        if(offers[offerID].amount == 0){
            offers[offerID].available = false;
        }
        

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
    }

    /// @notice receive token 1155
    function onERC1155Received(address, address, uint256, uint256, bytes memory) external virtual returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

}
