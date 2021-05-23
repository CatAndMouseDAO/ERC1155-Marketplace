const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { expectRevert,time } = require('@openzeppelin/test-helpers');
const { ethers, upgrades } = require("hardhat");

const truffleAssert = require('truffle-assertions');

const Market = artifacts.require("Market");
const TokenFactory = artifacts.require("GameItems");
const Swapper = artifacts.require("Swapper");
const _DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const _ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

const IERC20 = artifacts.require("IERC20");

contract("~ Market ~", ([marketManager, tokenCreator, buyer]) => {
	let token;
	let market;

	let shield;

	let price = 0;

	before(async () => {
		token = await TokenFactory.new({ from: tokenCreator });

		const swapper = await Swapper.new();
		await swapper.swap(_DAI, { value: web3.utils.toWei("1", "ether"), from: buyer });
		// console.log('Blance DAI: ',await dai.balanceOf(buyer));
		
		const MarketFactory = await ethers.getContractFactory("Market");
		const proxy = await upgrades.deployProxy(MarketFactory);
		market = await Market.at(proxy.address);

		console.log({
			token:token.address,
			market:market.address,
			marketManager:marketManager,
			tokenCreator:tokenCreator,
			buyer:buyer,
		});
	});


	describe("Selling", async function () {

		let offer;

		before(async () => {
			shield = Number(await token.SHIELD());
			const amount = (await token.balanceOf(tokenCreator, shield)).toString();
			const fiveMinutesOffer = Number(await time.latest()) + ( 5 * 60000 );
			const gameAddress = token.address;
			const dai = await IERC20.at(_DAI);

			offer = {
				admin: tokenCreator,
				token: gameAddress,
				tokenID: shield,
				amount: amount,
				deadline: fiveMinutesOffer,
				price: 2000
			};
		});

		it("Need Approval to make a offer", async function () {
			await expectRevert(
				market.MakeOffer(offer),
				"Approval Needed"
			);
		});

		it("Make an offer", async function () {

			await token.setApprovalForAll(market.address, true, {from: tokenCreator});
			const tx = await market.MakeOffer(offer, {from: tokenCreator});

			truffleAssert.eventEmitted(tx, 'Sell', (ev) => {
				return (
					ev.admin == offer.admin &&
					ev.token == offer.token &&
					ev.tokenID == offer.tokenID 
				);
			});

			// Getting the offer to check
			const _offer0 = await market.offers(0);
			const offer0 = {
				admin: tokenCreator,
				token: _offer0.token,
				tokenID: Number(_offer0.tokenID),
				amount: (_offer0.amount).toString(),
				deadline: Number(_offer0.deadline),
				price: Number(_offer0.price)
			};

			console.log('\tGas used: ', tx.receipt.gasUsed);
			// console.log('\tevents: ', tx);
			
			const isOfferSet = JSON.stringify(offer0) == JSON.stringify(offer);
			assert.isTrue(isOfferSet);
		});
	});

	describe("Consulting Price", async function () {
		it("Get price ETH => USD", async function () {
			let _price = (await market.getThePrice(_ETH)).toString();
			console.log('\tETH Price in USD: ', _price / 1e8);
			assert.notEqual(_price, 0);
		});
		it("Get price DAI => USD", async function () {
			let _price = (await market.getThePrice(_DAI)).toString();
			console.log('\tDAI Price in USD: ', _price / 1e8);
			assert.notEqual(_price, 0);
		});

		it("Get token price", async function () {
			price = (await market.getTokenPrice(0, _ETH)).toString();
			const _offer0 = await market.offers(0);
			// price = parseFloat(_price.slice(0, _price.length - 8) + '.' + _price.slice(_price.length - 8, _price.length));
			console.log('\tToken Price in USD: ', (_offer0.price).toString());
			console.log('\tToken Price in ETH: ', price);
			assert.notEqual(price, 0);
		});
	});

	describe("Buying", async function () {
		let preFee;
		let posFee;
		let preAuthorBalance;
		let posAuthorBalance;
		let preBuyerBalance;
		let posBuyerBalance;

		it("Buy the offer", async function () {

			const buyPreBalanace = Number(await token.balanceOf(buyer, shield));
			preFee = Number(await web3.eth.getBalance(marketManager));
			preAuthorBalance = Number(await web3.eth.getBalance(tokenCreator));
			preBuyerBalance = Number(await web3.eth.getBalance(buyer));
			const tx = await market.BuyOffer(0, _ETH, { from: buyer, value: web3.utils.toWei('1', 'ether') });

			timeStamp = Number(await time.latest());
			tokenPrice = Number(await market.getTokenPrice(0, _ETH));
			_fee = Number(await market.getTokenPrice(0, _ETH)) / 100;
			truffleAssert.eventEmitted(tx, 'Buy', (ev) => {
				return (
					ev.buyer == buyer &&
					ev.token == token.address &&
					ev.tokenID == 4 &&
					ev.deadline == timeStamp &&
					ev.price == tokenPrice &&
					ev.fee == _fee
				);
			});

			const buyPosBalanace = Number(await token.balanceOf(buyer, shield));
			posFee = Number(await web3.eth.getBalance(marketManager));
			posAuthorBalance = Number(await web3.eth.getBalance(tokenCreator));
			posBuyerBalance = Number(await web3.eth.getBalance(buyer));
			console.log('\tGas used: ', tx.receipt.gasUsed);
			
			// balance of Token must increase
			assert.isAbove(buyPosBalanace, buyPreBalanace);
		});

		it("Fee charged", async function () {
			const fee = Number(await market.getTokenPrice(0, _ETH)) / 100; // 1% of token price
			// assert.equal(preFee + fee, posFee);
		});

		it("Payment to the author", async function () {
			console.log({
				preAuthBalance:preAuthorBalance/*-price*/,
				posAuthBalance:posAuthorBalance
			});
			// diff btw posBalance - (preBalnace + price) < 3.000.000
			expect(posAuthorBalance).to.be.closeTo(preAuthorBalance+Number(price), 3e6)
		});

		it("Eth refund", async function () {
			console.log({
				preBuyerBalance:preBuyerBalance/*-price*/,
				posBuyerBalance:posBuyerBalance
			});
			const fee = Number(await web3.utils.toWei('0.01', 'ether')); // 1% of 1 Ether of previous test
			//expect(preBuyerBalance).to.be.closeTo(posBuyerBalance-Number(price)-fee, 3e6)
		});

		it("Buy the offer with ERC20", async function () {

			sword = Number(await token.SWORD());
			const amount = (await token.balanceOf(tokenCreator, sword)).toString();
			const fiveMinutesOffer = Number(await time.latest()) + ( 5 * 60000 );
			const gameAddress = token.address;
			const dai = await IERC20.at(_DAI);

			const _offer = {
				admin: tokenCreator,
				token: gameAddress,
				tokenID: sword,
				amount: amount,
				deadline: fiveMinutesOffer,
				price: 1500
			};

			let tx = await market.MakeOffer(_offer, {from: tokenCreator});
			const offerID = Number(tx.logs[0].args.offerID);

			const price = (await market.getTokenPrice(offerID, _DAI)).toString();
			await dai.approve(market.address, parseInt(price * 1.5), {from: buyer});

			tx = await market.BuyOffer(offerID, _DAI, { from: buyer, value: web3.utils.toWei('0.001', 'ether') });
			const daiBalanceTokenCreator = Number(await dai.balanceOf(tokenCreator));
			const daiBalanceCollector = Number(await dai.balanceOf(marketManager));
			
			console.log('\tGas used: ', tx.receipt.gasUsed);
			
			assert.equal(daiBalanceTokenCreator, price, "payment to token creator");
			assert.equal(daiBalanceCollector, parseInt(price / 100), "payment of fee");
		});
	});

	describe("Rejecting", async function () {

		it("Offer already sold", async function () {
			await expectRevert(
				market.BuyOffer(0, _ETH, { from: buyer, value: web3.utils.toWei('1', 'ether') }),
				"Offer is not available"
			);
		});
		it("Expired offer", async function () {
			const gold = Number(await token.GOLD());
			const fiveMinute = (5 * 60000);

			// approval already set
			const tx = await market.MakeOffer({
				admin: tokenCreator,
				token: token.address,
				tokenID: gold,
				amount:  (await token.balanceOf(tokenCreator, gold)).toString(),
				deadline: Number(await time.latest()) + fiveMinute, // 5 minute offer !!!
				price: 5000
			}, {from: tokenCreator});
			const offerID = Number(tx.logs[0].args.offerID);
			
			await time.increase(fiveMinute+1); // to late :(
				
			await expectRevert(
				market.BuyOffer(offerID, _ETH, { from: buyer, value: web3.utils.toWei('1', 'ether') }),
				"Expired offer"
			);
		});
		it("Cancelled offer", async function () {
			const silver = Number(await token.SILVER());

			let tx = await market.MakeOffer({
				admin: tokenCreator,
				token: token.address,
				tokenID: silver,
				amount:  (await token.balanceOf(tokenCreator, silver)).toString(),
				deadline: Number(await time.latest()) + 60 * 60000,
				price: 5000
			}, {from: tokenCreator});
			const offerID = Number(tx.logs[0].args.offerID);

			tx = await market.cancelOffer(offerID, { from: tokenCreator });

			const timeStamp = Number(await time.latest());
			truffleAssert.eventEmitted(tx, 'Cancel', (ev) => {
				return (
					ev.canceller == tokenCreator &&
					ev.token == token.address &&
					ev.tokenID == silver &&
					ev.time ==  timeStamp
				);
			});	

			await expectRevert(
				market.BuyOffer(offerID, _ETH, { from: buyer, value: web3.utils.toWei('1', 'ether') }),
				"Offer is not available"
			);
		});
	});

});
