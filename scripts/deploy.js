const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

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

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
