module.exports = {

  friendlyName: 'Find Txn',

  description: 'Finds txns.',

  inputs: {
    //
  },

  exits: {
    //
  },

  fn: async function () {
    let txns;
    try {
      txns = await Txn.find({}).limit(10);
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: true,
      txns,
    };
  },
};
