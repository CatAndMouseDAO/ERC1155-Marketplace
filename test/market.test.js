const Market = artifacts.require("Market");

contract("Market", accounts => {
	it("Get price ETH => USD", async function () {
		const market = await Market.new();
		const price = (await market.getThePrice()).toString();
		console.log('\tPrice: ', price);
	});
});
