
/*
wsCHEEZ:  0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
NFT:  0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
Market:  0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
DAO:  0x70997970C51812dc3A010C7d01b50e0d17dc79C8
*/

const { ethers } = require("hardhat");
const { expectRevert,time } = require('@openzeppelin/test-helpers');


async function main() {
  const [deployer, dao, buyer] = await ethers.getSigners();

		// Large number for approvals
		const largeApproval = '100000000000000000000000000000000';
		// Initial mint for wsCHEEZ
		const initialMint = '10000000000000000000000000';
        const wSCHEEZ_contract = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853'
        const nft_contract = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318'
        const market_contract = '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e'
	
		// Deploy DAI
		console.log("attach wsCHEEZ")
		const WSCHEEZ = await ethers.getContractFactory('WSCHEEZ');
		const wsCHEEZ = await WSCHEEZ.attach(wSCHEEZ_contract);
	
		console.log("deploy NFT")
		const NFT = await ethers.getContractFactory('NFT');
		const nft = await NFT.attach(nft_contract)
	
		console.log("deploy market")
		const Market = await ethers.getContractFactory('Market')
		const market = await Market.attach(market_contract)


        console.log("Set offer")
		const fiveMinutesOffer = Number(await time.latest()) + ( 5 * 60000 );
		const price = ethers.utils.parseUnits("3").toString()

		console.log("Setup approval for nft")
		await nft.setApprovalForAll(market.address, true);
		console.log("Make Offer")
		let sell_amount = 10
		let token_id = 0
		await market.MakeOffer(nft.address, token_id, sell_amount, fiveMinutesOffer, price)

		let nftBal = await nft.balanceOf(buyer.address, 0)
		console.log("Buyer NFT bal before: ", nftBal.toString())

		console.log("Approve tokens and Buy offer")
		await wsCHEEZ.connect(buyer).approve(market.address, largeApproval);

		let offer_id = 0 
		let ammount = 1 
		await market.connect(buyer).BuyOffer(offer_id, ammount);
		nftBal = await nft.balanceOf(buyer.address, 0)
		console.log("buyer NFT bal after: ", nftBal.toString())

		// test buying the other 9 offered 
		await market.connect(buyer).BuyOffer(offer_id, 9);
		nftBal = await nft.balanceOf(buyer.address, token_id)
		console.log("buyer NFT bal after: ", nftBal.toString())

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });