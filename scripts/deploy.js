const { ethers } = require("hardhat");

async function main() {
  const [deployer, dao, buyer] = await ethers.getSigners();
		const Market = await ethers.getContractFactory('Market')
		const market = await Market.deploy("0xBbD83eF0c9D347C85e60F1b5D2c58796dBE1bA0d", "0x4a4EfE716C522ec9C0f78BD19F6F7Ed4851831dc")
		
		console.log("Market: ", market.address )
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
