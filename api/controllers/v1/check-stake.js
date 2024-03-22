module.exports = {

  friendlyName: 'Check Stake',
  description: '',

  inputs: {
    stake: {
      type: {},
      required: true,
    },
    sig: {
      type: {},
      required: true,
    },
  },

  exits: {
    //
  },

  fn: async function ({ stake, sig, }) {
    const addr = await Web3Service.stakeSignedCheck({ stake, sig, });

    return { success: true, addr, };
  },
};
