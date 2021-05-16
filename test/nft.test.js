const tokenFactory = artifacts.require("GameItems");
const axios = require("axios");

contract("NTF", accounts => {
	let token;
	before(async () => {
		token = await tokenFactory.new();
	});
	it("get Token", async function () {
		const THORS_HAMMER = (await token.THORS_HAMMER()).toString();
		const item = (await token.uri(THORS_HAMMER))
			.toString()
			.replace('{id}', THORS_HAMMER.padStart(64, "0"));
		const { data } = await axios.get(item);
		for (tokenID in { THORS_HAMMER: 0 })
			console.log("\t", tokenID, "\n", data);
	});
});
