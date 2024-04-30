const { base } = require('viem/chains');

const gamewallet = require('./data/contracts/gamewallet.json');
const usdc = require('./data/contracts/usdc.json');

module.exports.custom = {
  blockchain: {
    chainId: 8453,
    chain: base,
    contracts: {
      hangman: gamewallet,
      usdc,
    },
  },
};
