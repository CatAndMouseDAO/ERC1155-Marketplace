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
	// it("Create a offert", async function () {
	// 	const market = await Market.new();
	// 	const price = (await market.getThePrice()).toString();
	// 	console.log('\tPrice: ', price);
	// });
});
