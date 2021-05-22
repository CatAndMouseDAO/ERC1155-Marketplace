const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const { expectRevert,time } = require('@openzeppelin/test-helpers');

const Market = artifacts.require("Market");
const TokenFactory = artifacts.require("GameItems");

contract("~ Market ~", ([marketManager, tokenCreator, buyer]) => {
	let token;
	let market;

	let shield;

	let price = 0;

	before(async () => {
		token = await TokenFactory.new({ from: tokenCreator });
		market = await Market.new({ from: marketManager });

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
			const isOfferSet = JSON.stringify(offer0) == JSON.stringify(offer);

			assert.isTrue(isOfferSet);
		});
	});

	describe("Consulting Price", async function () {
		it("Get price ETH => USD", async function () {
			let _price = (await market.getThePrice()).toString();
			_price = parseFloat(_price.slice(0, _price.length - 8) + '.' + _price.slice(_price.length - 8, _price.length));
			console.log('\tETH Price in USD: ', _price);
			assert.notEqual(_price, 0);
		});

		it("Get token price", async function () {
			price = (await market.getTokenPrice(0)).toString();
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
			const tx = await market.BuyOffer(0, { from: buyer, value: web3.utils.toWei('1', 'ether') });
			const buyPosBalanace = Number(await token.balanceOf(buyer, shield));
			posFee = Number(await web3.eth.getBalance(marketManager));
			posAuthorBalance = Number(await web3.eth.getBalance(tokenCreator));
			posBuyerBalance = Number(await web3.eth.getBalance(buyer));
			console.log('\tGas used: ', tx.receipt.gasUsed);
			
			// balance of Token must increase
			assert.isAbove(buyPosBalanace, buyPreBalanace);
		});

		it("Fee charged", async function () {
			const fee = Number(await web3.utils.toWei('0.01', 'ether')); // 1% of 1 Ether of previous test
			assert.equal(preFee + fee, posFee);
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
	});

	describe("Rejecting", async function () {

		it("Offer already sold", async function () {
			await expectRevert(
				market.BuyOffer(0, { from: buyer, value: web3.utils.toWei('1', 'ether') }),
				"Offer is not available"
			);
		});
		it("Expired offer", async function () {
			const gold = Number(await token.GOLD());
			const fiveMinute = (5 * 60000);

			// approval already set
			const offerID = await market.MakeOffer({
				admin: tokenCreator,
				token: token.address,
				tokenID: gold,
				amount:  (await token.balanceOf(tokenCreator, gold)).toString(),
				deadline: Number(await time.latest()) + fiveMinute, // 5 minute offer !!!
				price: 5000
			}, {from: tokenCreator});
			
			await time.increase(fiveMinute+1); // to late :(
				
			await expectRevert(
				market.BuyOffer(1, { from: buyer, value: web3.utils.toWei('1', 'ether') }),
				"Expired offer"
			);
		});
		it("Expired offer", async function () {
			const silver = Number(await token.SILVER());

			const offerID = await market.MakeOffer({
				admin: tokenCreator,
				token: token.address,
				tokenID: silver,
				amount:  (await token.balanceOf(tokenCreator, silver)).toString(),
				deadline: Number(await time.latest()) + 60 * 60000,
				price: 5000
			}, {from: tokenCreator});

			market.cancelOffer(2, { from: tokenCreator }),
				
			await expectRevert(
				market.BuyOffer(2, { from: buyer, value: web3.utils.toWei('1', 'ether') }),
				"Offer is not available"
			);
		});
	});

});
