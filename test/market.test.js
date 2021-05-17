const { web3 } = require('@openzeppelin/test-helpers/src/setup');

const Market = artifacts.require("Market");
const TokenFactory = artifacts.require("GameItems");

contract("~ Market ~", ([marketManager, tokenCreator, buyer]) => {
	let token;
	let market;

	let shield;

	before(async () => {
		token = await TokenFactory.new({ from: tokenCreator });
		market = await Market.new({ from: marketManager });
	});

	describe("Make an offer", async function () {

		let offer;

		before(async () => {
			shield = Number(await token.SHIELD());
			const amount = (await token.balanceOf(tokenCreator, shield)).toString();
			const fiveMinutesOffer = Math.round(Date.now() / 1000) + (60 * 5);
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
			try {
				const tx = await market.MakeOffer(offer);
			}
			catch (err) {
				const isNeedApprovalErr = err.toString().includes("Approval Needed");
				assert.isTrue(isNeedApprovalErr);
			}
		});

		it("Make an offer successfully", async function () {

			await token.setApprovalForAll(market.address, true, {from: tokenCreator});
			x = await token.isApprovedForAll(tokenCreator,market.address);
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
		let price = 0;

		it("Get price ETH => USD", async function () {
			const _price = (await market.getThePrice()).toString();
			price = parseFloat(_price.slice(0, _price.length - 8) + '.' + _price.slice(_price.length - 8, _price.length));
			console.log('\tETH Price in USD: ', price);
			assert.notEqual(price, 0);
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

	describe("Buy the offer", async function () {
		it("Buy the offer", async function () {

			const buyPreBalanace = (await token.balanceOf(buyer, shield)).toString();
			const OwnPreBalanace = (await token.balanceOf(tokenCreator, shield)).toString();
			market.BuyOffer(0, { from: buyer, value: web3.utils.toWei('1', 'ether') });
			const buyPosBalanace = (await token.balanceOf(buyer, shield)).toString();
			const OwnPosBalanace = (await token.balanceOf(tokenCreator, shield)).toString();
			console.log(
				'buyPreBalanace: ', buyPreBalanace,
				'OwnPreBalanace: ', OwnPreBalanace,
				'buyPosBalanace: ', buyPosBalanace,
				'OwnPosBalanace: ', OwnPosBalanace,
			);
		});
	});

});
