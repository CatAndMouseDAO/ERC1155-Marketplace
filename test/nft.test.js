const tokenFactory = artifacts.require("GameItems");
const axios = require("axios");

contract("NTF", ([owner, timmy]) => {
	let token;

	before(async () => {
		token = await tokenFactory.new();
	});
	it("get Token", async function () {
		const THORS_HAMMER = (await token.THORS_HAMMER()).toString();
		const uri_path = (await token.uri(THORS_HAMMER))
			.toString()
			.replace('{id}', THORS_HAMMER.padStart(64, "0"));
		const { data } = await axios.get(uri_path);

		uri_local = {
			description: "GameItems - Thor's Hammer",
			external_url: "https://forum.openzeppelin.com",
			image: "https://openmoji.org/data/color/svg/1F528.svg",
			name: "Thor's Hammer"
		};

		const isUriGet = JSON.stringify(data) == JSON.stringify(uri_local);

		// for (tokenID in { THORS_HAMMER: 0 })
		// 	console.log("\t", tokenID, "\n", data);

		assert.isTrue(isUriGet);
	});
	it("Owner balance", async function () {
		const SILVER = (await token.SILVER()).toString();
		const balanceOwner = (await token.balanceOf(owner, SILVER)).toString();
		assert.equal(balanceOwner, 20);
	});
	it("Other person balance", async function () {
		const GOLD = (await token.GOLD()).toString();
		const balance = (await token.balanceOf(timmy, GOLD)).toString();
		assert.equal(balance, 0);
	});
});
