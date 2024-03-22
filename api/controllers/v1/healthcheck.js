module.exports = {

  friendlyName: 'Healthcheck',

  description: 'Checks if the server is up and running.',

  inputs: {
    //
  },

  exits: {
    //
  },

  fn: async function () {
    return { success: true };
  },
};
