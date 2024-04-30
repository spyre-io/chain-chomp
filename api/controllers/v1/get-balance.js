module.exports = {

  friendlyName: 'Get USDC balance.',

  description: '',

  inputs: {
    coin: {
      type: 'string',
      required: true,
    },
    addr: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    //
  },

  fn: async function ({ coin, addr, }) {
    let balance;
    try {
      balance = await Web3Service.getBalance(this.req.logger, { coin, addr, });
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }

    return {
      success: true,
      balance: balance.toString(),
    };
  },
};
