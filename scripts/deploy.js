const { ethers } = require("hardhat");

async function main() {
  const [deployer, dao] = await ethers.getSigners();

  // Large number for approvals
  const largeApproval = '100000000000000000000000000000000';
  // Initial mint for wsCHEEZ
  const initialMint = '10000000000000000000000000';

  // Deploy DAI
  const WSCHEEZ = await ethers.getContractFactory('WSCHEEZ');
  const wsCHEEZ = await WSCHEEZ.deploy( 0 );
  await wsCHEEZ.mint( deployer.address, initialMint );

  const NFT = await ethers.getContractFactory('NFT');
  const nft = await NFT.deploy()
  await nft.mint(initialMint)

  const Market = await ethers.getContractFactory('Market')
  const market = await Market.deploy(wsCHEEZ, DAO.address)

  await nft.setApprovalForAll(market.address, true)
  await wsCHEEZ.setApprovalForAll(market.address, true)

  console.log("wsCHEEZ: ", wsCHEEZ.address )
  console.log("NFT: ", nft.address )
  console.log("Market: ", market.address )
  console.log("DAO: ", dao.address )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
