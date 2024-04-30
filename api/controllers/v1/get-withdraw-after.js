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
    let withdrawAfter = await Web3Service.getWithdrawAfter(this.req.logger, { addr, });
    
    return {
      success: true,
      withdrawAfter: withdrawAfter.toString(),
    };
  },
};
