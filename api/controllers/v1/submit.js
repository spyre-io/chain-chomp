module.exports = {

  friendlyName: 'Submits Score',

  description: '',

  inputs: {
    stake1: {
      type: {},
      required: true,
    },
    stake2: {
      type: {},
      required: true,
    },
    signedMsg1: {
      type: {},
      required: true,
    },
    signedMsg2: {
      type: {},
      required: true,
    },
    matchId: {
      type: 'string',
      required: true,
    },
    winner: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    txnId : {
      outputType: 'string',
      description: 'The transaction ID of the submitted score',
    },
  },

  fn: async function ({ stake1, stake2, signedMsg1, signedMsg2, matchId, winner, }) {
    let txn;
    try {
      txn = await Web3Service.submit(this.req.logger, {
        stake1,
        stake2,
        signedMsg1,
        signedMsg2,
        matchId,
        winner,
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
