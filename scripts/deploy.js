const { ethers } = require("hardhat");
const axios = require('axios')

async function main() {
	const [deployer, dao, buyer] = await ethers.getSigners();
	const Market = await ethers.getContractFactory('Market')
	const NFT = await ethers.getContractFactory('NFT')
	const market = Market.attach("0x5d28FC5BC1065DA8dEC396D0c5D20c524CA83278")
	const nft = NFT.attach("0x4e9c30CbD786549878049f808fb359741BF721ea")

	const listingsFilter = market.filters.Sell();
	const buyFilter = market.filters.Buy();
	const cancelFilter = market.filters.Cancel();
	const sells = await market.queryFilter(listingsFilter, 20296479, 'latest');
	const buys = await market.queryFilter(buyFilter, 20296479, 'latest');
	const cancels = await market.queryFilter(cancelFilter, 20296479, 'latest');

	let listings = {}
	for(let i = 0; i < sells.length; i++){
		let sell = sells[i]
		let Obj = {
			'admin': sell.args.admin,
			'token': sell.args.token,
			'tokenId': parseInt(sell.args.tokenID.toString()),
			'amount': parseInt(sell.args.amount.toString()),
			'deadline': parseInt(sell.args.deadline.toString()),
			'price': sell.args.price.toString(),
			'available': true,
			'cancelable': true,
		}
		listings[sell.args.offerID.toString()] = Obj
	}
	for(let i = 0; i < cancels.length; i++){
		let cancel = cancels[i]
		let id = cancel.args.offerID.toString()
		let l = listings[id]
		l['available'] = false
		l['cancelable'] = false		
		listings[id] = l
		//await axios.get('https://api.cheesedao.xyz/apiv1/marketplace/unlistOfferId?unlistOfferId=' + id)
		//console.log("removed listng: ", id)
	}
	for(let i = 0; i < buys.length; i++){
		let buy = buys[i]
		let l = listings[buy.args.offerID.toString()]
		l['amount'] = l['amount'] - parseInt(buy.args.amount)
		if(l['amount'] == 0){
			l['available'] = false
			l['cancelable'] = false	
		}
		listings[buy.args.offerID.toString()] = l
	}

	let keys = Object.keys(listings);
	for(let i=602; i < keys.length; i++){
		id = keys[i]
		l = listings[id]
		if(l['available']){
			let balance = await nft.balanceOf(l.admin, l.tokenId)
			if(parseInt(balance.toString()) < parseInt(l.amount)){
				console.log(l)
				console.log("Found Listing of Size ", l.amount, " with user bal ", balance.toString())
				await axios.get('https://api.cheesedao.xyz/apiv1/marketplace/unlistOfferId?unlistOfferId=' + id)
				console.log("removed listng: ", id)
			}
		}
	}
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
