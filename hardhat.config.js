/**
 * @type import('hardhat/config').HardhatUserConfig
 */

require("dotenv").config();
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-truffle5");
require("@nomiclabs/hardhat-etherscan");
require('@openzeppelin/hardhat-upgrades');

module.exports = {
    solidity: {
      compilers: [
        {
          version: "0.5.16",
        },
        {
          version: "0.8.4",
          settings: {},
        },
        {
          version: "0.7.5",
          settings: {},
        }
      ],
    },
    networks: {
      hardhat: {
          throwOnTransactionFailures: true,
          throwOnCallFailures: true,
          allowUnlimitedContractSize: true,
          blockGasLimit: 0x1fffffffffffff,
          forking:{
              url: "https://api.harmony.one/"
          }
       },
      testnet: {
        accounts: ["0xa5fa140ec021037dd588f3a209bde78fcf495a66676591f17d2b0718e2f5b787"],
        url: "https://api.s0.b.hmny.io/"
      },
      mainnet: {
          accounts: ["7235b527359e7b2c6bba3617305c1fedecb36e1cbc056c753d7b36a7f8d66e8d"],
          url: "https://harmony-0-rpc.gateway.pokt.network",
          gasPrice: 200000000000
      }
    },
    mocha: {
      timeout: 20000000000
    }
  };