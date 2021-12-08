#!/bin/bash
# ./automateMakeOffer.sh {runs}

runs=$1
counter=1

while [ $counter -le $runs ]
do
    npx hardhat run scripts/make_offer.js --network localhost
    echo $counter
    ((counter++))
    sleep 0.1
done
echo "Ran"
