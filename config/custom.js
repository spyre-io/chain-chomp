
module.exports.custom = {
  blockchain: {
    contracts: {
      hangman: {
        addr: '0x6140CC72B97d5c8b025832f329E86CEA011E60e2',
        abi: require('./data/contracts/mumbai.hangman.json').abi,
      },
      usdc: {
        addr: '0xB408CC68A12d7d379434E794880403393B64E44b',
        abi: require('./data/contracts/erc20.json').abi,
      },
      wmatic: {
        addr: '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
        abi: require('./data/contracts/mumbai.wmatic.json').abi,
      }
    },
  },
};
