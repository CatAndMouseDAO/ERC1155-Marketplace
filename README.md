## V1

- ❌The marketplace contract should be upgradeable
- ✅Admin will charge 1% fees for every sale (only admin should be able to update fee % and recipient address)
- ✅Seller will create the offer, passing the ERC1155 token address, token ID, amount of tokens, deadline and the price in USD for all the tokens sold. (not price per token)
- ❌When a user buys a token, the ETH, DAI or LINK tokens are sent to the seller
- ✅When paying with ETH, you need to refund the buyer if he sends more ETH than the amount used for the sale
- ✅You need to use chainlink oracles to get the latest price in USD for the payment token.
- ❌Sellers can cancel an offer anytime.
- ✅Buyers need to accept the whole offer, not partially (i.e. can’t buy 4 out of 10 tokens offered)
- ✅Users won't transfer the token to the marketplace when selling. They only approve the marketplace to spend their tokens.
- ✅Use forked mainnet to test with chainlink oracles.
- ❌Add events for selling, buying and cancelling offers
- ✅Create a new PRIVATE github repo, add me to it @wafflemakr, push constantly
- ❌Remember to add comments to your functions!!

## V2

Also, about the deadline for this assignment, I said "treat it as it was for Sunday", just to make sure everyone starts working and not leaving it for the last day. But, its not for today, FYI. If you are done, try to make a V2, adding more tokens, or allowing also ERC721 token sales. 👍🏻