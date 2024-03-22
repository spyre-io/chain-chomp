module.exports = {

  friendlyName: 'Withdraw',

  description: 'Withdraws for a user.',

  inputs: {
    withdraw: {
      type: {},
      required: true,
    },
    signature: {
      type: {},
      required: true,
    },
  },

  exits: {
    txnId : {
      outputType: 'string',
      description: 'The transaction ID of the withdrawal.',
    },
  },

  fn: async function ({ withdraw, signature }) {
    let result;
    try {
      result = await Web3Service.withdraw({
        withdraw,
        signature,
      });
    } catch (err) {
      console.error(err);
      
      return {
        success: false,
        error: err.message,
      };
    }
    
    Logger.info(result);

    return { 
      success: true,
      txnId: result.transactionHash,
    };
  },
};
