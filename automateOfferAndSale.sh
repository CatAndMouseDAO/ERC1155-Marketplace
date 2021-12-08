#!/bin/bash
# ./automateMakeOffer.sh {runs}

runs=$1
counter=1

while [ $counter -le $runs ]
do
    npx hardhat run scripts/make_offer.js --network localhost  
    sleep  4
    npx hardhat run scripts/make_sale.js --network localhost
    # npx hardhat run scripts/make_offer.js --network localhost
    echo $counter
    ((counter++))
    sleep 2
done
echo "Ran"
