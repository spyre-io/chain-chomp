module.exports = {

  friendlyName: 'Submit Permit',

  description: 'Submits Permit for USDC Transfer.',

  inputs: {
    permit: {
      type: {},
      required: true,
    },
    signedMsg: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    txnId : {
      outputType: 'string',
      description: 'The transaction ID of the submitted permit.',
    },
  },

  fn: async function ({ permit, signedMsg, }) {
    let txn;
    try {
      txn = await Web3Service.submitPermit(this.req.logger, {
        permit, signedMsg,
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
