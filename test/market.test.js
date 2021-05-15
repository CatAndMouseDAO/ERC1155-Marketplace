const Market = artifacts.require("Market");

// Traditional Truffle test
contract("Market", ([admin, alice, bob, random]) => {
  it("Get price ETH => USD", async function () {
    const market = await Market.new();
    const price = (await market.getThePrice()).toString();

    console.log(' Price: ', price);
  });
});
