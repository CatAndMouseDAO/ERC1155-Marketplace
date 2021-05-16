const Market = artifacts.require("Market");
const tokenFactory = artifacts.require("GameItems");

contract("Market", accounts => {
	let token;
	let market;
	let price = 0;

	before(async () => {
		token = await tokenFactory.new();
		market = await Market.new();
	});

	it("Get price ETH => USD", async function () {
		const _price = (await market.getThePrice()).toString();
		price = parseFloat(_price.slice(0, _price.length - 8) + '.' + _price.slice(_price.length - 8, _price.length));
		//console.log('\tPrice: ', price);
		assert.notEqual(price, 0);
	});

	it("Make an offer", async function () {

		const shield = Number(await token.SHIELD());
		const amount = (await token.balanceOf(accounts[0], shield)).toString();
		const fiveMinutesOffer = Math.round(Date.now() / 1000) + (60 * 5);
		const gameAddress = token.address;

		const offer = {
			token: gameAddress,
			tokenID: shield,
			amount: amount,
			deadline: fiveMinutesOffer,
			price: 2000
		};

		const tx = await market.MakeOffer(offer);
		const _offer0 = await market.offers(0);

		const offer0 = {
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
