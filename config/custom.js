const { base, baseSepolia } = require('viem/chains');

const gamewallet = require('./data/contracts/gamewallet.json');
const usdc = require('./data/contracts/usdc.json');

const withChain = (definition, chain) => ({
  addr: definition.addr[chain],
  abi: definition.abi,
});

const chooseNetwork = () => {
  console.info(`WEB3_CHAIN: ${process.env.WEB3_CHAIN}`);

  if (process.env.WEB3_CHAIN === 'base_mainnet') {
    return {
      chainId: 8453,
      contracts: {
        hangman: withChain(gamewallet, 'base_mainnet'),
        usdc: withChain(usdc, 'base_mainnet'),
      },
      chain: base,
      blockExplorer: 'https://basescan.org',
    };
  }

  return {
    chainId: 84532,
    contracts: {
      hangman: withChain(gamewallet, 'base_sepolia'),
      usdc: withChain(usdc, 'base_sepolia'),
    },
    chain: baseSepolia,
    blockExplorer: 'https://sepolia.basescan.org',
  }
};

module.exports.custom = {
  blockchain: chooseNetwork(),
};
