const { ethers } = require("hardhat");
const { expectRevert,time } = require('@openzeppelin/test-helpers');

function between(min, max) {  
	return Math.floor(
	  Math.random() * (max - min) + min
	).toString()
}

async function main() {
  const [deployer, dao, buyer] = await ethers.getSigners();

	// Large number for approvals
    const largeApproval = '100000000000000000000000000000000';
    // Initial mint for wsCHEEZ
    const initialMint = '10000000000000000000000000';
    const wSCHEEZ_contract =  process.env.wSCHEEZ_contract		
    const nft_contract = process.env.nft_contract 				//''
    const market_contract = process.env.market_contract 

    // Deploy DAI
    console.log(`attach wsCHEEZ ${wSCHEEZ_contract}`)
    const WSCHEEZ = await ethers.getContractFactory('WSCHEEZ');
    const wsCHEEZ = await WSCHEEZ.attach(wSCHEEZ_contract);

    console.log(`deploy NFT ${nft_contract}`)
    const NFT = await ethers.getContractFactory('NFT');
    const nft = await NFT.attach(nft_contract)

    console.log(`deploy market ${market_contract}`)
    const Market = await ethers.getContractFactory('Market')
    const market = await Market.attach(market_contract)

    let nftBal = await nft.balanceOf(buyer.address, 0)
    console.log("Buyer NFT bal before: ", nftBal.toString())

    console.log("Approve tokens and Buy offer")
    await wsCHEEZ.connect(buyer).approve(market.address, largeApproval);

    let amount = 1
    let offer_total = await market.numOffers()

    let offerId = offer_total - 1 // gets valid offer id to bid

    console.log("offerTotal toString " + offer_total.toString())
    console.log(`offerId ${offerId}`)

    // errs after this 

    await market.connect(buyer).BuyOffer(offerId, amount);
    nftBal = await nft.balanceOf(buyer.address, 0)
    console.log("buyer NFT bal after: ", nftBal.toString())

    let tokenId  = 0
    // test buying the other 9 offered 
    //await market.connect(buyer).BuyOffer(offerId, 1);
    //nftBal = await nft.balanceOf(buyer.address, tokenId)
    //console.log("buyer NFT bal after: ", nftBal.toString())

}

main()
.then(() => process.exit(0))
.catch((error) => {
console.error(error);
process.exit(1);
});
