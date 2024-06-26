module.exports = {

  friendlyName: 'Get Nonce',

  description: 'Gets the hangman nonce for a wallet.',

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
    let nonce;
    try {
      nonce = await Web3Service.getNonce(this.req.logger, { addr, });
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      nonce: nonce.toString(),
    };
  },
};
