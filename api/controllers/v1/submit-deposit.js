module.exports = {

  friendlyName: 'Submit Deposit',

  description: 'Submits Deposit for USDC Transfer into Game Wallet.',

  inputs: {
    deposit: {
      type: {},
      required: true,
    },
    signedMsg: {
      type: {},
      required: true,
    },
  },

  exits: {
    txnId : {
      outputType: 'string',
      description: 'The transaction ID of the submitted deposit.',
    },
  },

  fn: async function ({ deposit, signedMsg, }) {
    let txn;
    try {
      txn = await Web3Service.submitDeposit(this.req.logger, {
        deposit, signedMsg,
      });
    } catch (err) {
      return {
        success: false,
        error: err.message,
      };
    }

    if (txn.status === 'failure') {
      return {
        success: false,
        txnId: txn.id,
        error: txn.error,
      };
    }

    return {
      success: true,
      txnId: txn.id,
    };
  },
};
