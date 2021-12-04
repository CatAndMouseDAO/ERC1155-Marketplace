const { expect } = require("chai");
const { ethers } = require("hardhat");
const { expectRevert,time } = require('@openzeppelin/test-helpers');

describe("Token contract", function () {
	it("Deploy and list", async function () {
		const [deployer, dao, buyer] = await ethers.getSigners();

		// Large number for approvals
		const largeApproval = '100000000000000000000000000000000';
		// Initial mint for wsCHEEZ
		const initialMint = '10000000000000000000000000';
	
		// Deploy DAI
		console.log("deploy wsCHEEZ")
		const WSCHEEZ = await ethers.getContractFactory('WSCHEEZ');
		const wsCHEEZ = await WSCHEEZ.deploy( 0 );
		await wsCHEEZ.mint( deployer.address, initialMint );
	
		console.log("deploy NFT")
		const NFT = await ethers.getContractFactory('NFT');
		const nft = await NFT.deploy()
		await nft.mint(initialMint)
	
		console.log("deploy market")
		const Market = await ethers.getContractFactory('Market')
		const market = await Market.deploy(wsCHEEZ.address, dao.address)
		
		console.log("wsCHEEZ: ", wsCHEEZ.address )
		console.log("NFT: ", nft.address )
		console.log("Market: ", market.address )
		console.log("DAO: ", dao.address )
	
		console.log("Set offer")
		const fiveMinutesOffer = Number(await time.latest()) + ( 5 * 60000 );
		const price = ethers.utils.parseUnits("3").toString()		
		await wsCHEEZ.transfer(buyer.address, price);

		console.log("Setup approval for nft")
		await nft.setApprovalForAll(market.address, true);
		console.log("Make Offer")
		await market.MakeOffer(nft.address, 0, 1, fiveMinutesOffer, price)

		let nftBal = await nft.balanceOf(buyer.address, 0)
		console.log("Buyer NFT bal before: ", nftBal.toString())
		console.log("Approve tokens and Buy offer")
		await wsCHEEZ.connect(buyer).approve(market.address, largeApproval);
		await market.connect(buyer).BuyOffer(0, 1);
		nftBal = await nft.balanceOf(buyer.address, 0)
		console.log("buyer NFT bal after: ", nftBal.toString())

	});
});
