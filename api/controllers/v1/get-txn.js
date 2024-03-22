module.exports = {

  friendlyName: 'Get Txn',

  description: 'Retrieves a txn.',

  inputs: {
    txnId: {
      type: 'string',
      required: true,
    },
  },

  exits: {
    //
  },

  fn: async function ({ txnId, }) {
    let txn;
    try {
      txn = await Txn.findOne({ id: txnId, });
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (!txn) {
      return {
        success: false,
        error: 'Txn not found.',
      };
    }

    return {
      success: true,
      txn,
    };
  },
};
