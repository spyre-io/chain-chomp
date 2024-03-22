
module.exports = {
  attributes: {
    method: {
      type: "string",
      required: true,
    },
    params: {
      type: "json",
      required: true,
    },
    status: {
      type: "string",
      isIn: [
        "not-started",
        "sent",
        "waiting-for-confirmation",
        "success",
        "failure",
      ],
      defaultsTo: "pending",
    },
    txnHash: {
      type: "string",
    },
    receipt: {
      type: "json",
    },
    error: {
      type: "string",
    },
  },
};
