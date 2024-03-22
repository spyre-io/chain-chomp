module.exports = {

  friendlyName: 'Get WithdrawAfter',

  description: 'Returns the withdrawAfter timestamp for an address.',

  inputs: {
    addr: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    //
  },

  fn: async function ({ addr, }) {
    let withdrawAfter;
    try {
      withdrawAfter = await Web3Service.getWithdrawAfter({ addr, });
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }

    return {
      success: true,
      withdrawAfter: withdrawAfter.toString(),
    };
  },
};
