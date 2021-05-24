// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title Market for ERC1155 token
/// @author Nazh_G
contract Market is OwnableUpgradeable {

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
    mapping(address => address) public PaymentsAllowed;

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

    address _ETH;

    /// @dev init PaymentsAllowed, fee and collerctor
    function initialize() external initializer {
        __Ownable_init_unchained();

        collector = payable(tx.origin);
        fee = 100;

        _ETH = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
        PaymentsAllowed[_ETH] = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
        PaymentsAllowed[0x6B175474E89094C44Da98b954EedeAC495271d0F] = 0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9;
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

    /// @notice Returns the latest price of a token
    function getThePrice(address paymentMethod) public view returns (int256) {
        require(PaymentsAllowed[paymentMethod] != address(0),"Payment method not supported");
        AggregatorV3Interface priceFeed = AggregatorV3Interface(PaymentsAllowed[paymentMethod]);
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    /// @notice Returns the price of a Offer
    function getTokenPrice(uint256 offerID, address paymentMethod)
        public
        view
        existOffer(offerID)
        returns (uint256)
    {
        uint256 price;
        // ETH need a different logic to get most decimal posible
        if (paymentMethod == _ETH) {
            price = (uint256(1 ether / offers[offerID].price) *
                    uint256(getThePrice(paymentMethod)) / 10**8);
        } else {
            price = (offers[offerID].price * uint256(getThePrice(paymentMethod))/ 10**8);
        }
        return price;
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
    function BuyOffer(uint256 offerID, address paymentMethod) public payable existOffer(offerID) {
        
        require(offers[offerID].available,"Offer is not available");
        require(offers[offerID].deadline >= block.timestamp,"Expired offer");
        
        ERC1155 token = ERC1155(offers[offerID].token);
        uint256 price = getTokenPrice(offerID, paymentMethod);
        uint256 _fee = price / fee;

        
        if( paymentMethod == _ETH ) { // ETH transfers
            require(msg.value >= price + _fee, "not enough ETH");
            collector.transfer(_fee);
            offers[offerID].admin.transfer(price);
        } else { // ERC20 transfers
            IERC20 paymentToken = IERC20(paymentMethod);
            uint256 funds = paymentToken.allowance(msg.sender, address(this));
            require(funds >= price + _fee, "not enough funds");
            paymentToken.transferFrom(msg.sender, collector, _fee);
            paymentToken.transferFrom(msg.sender, offers[offerID].admin, price);
        }

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
        payable(msg.sender).transfer(address(this).balance);
    }

    /// @notice receive token 1155
    function onERC1155Received(address, address, uint256, uint256, bytes memory) external virtual returns (bytes4) {
        return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
    }

}
