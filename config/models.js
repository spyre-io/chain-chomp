
module.exports.models = {

  schema: true,
  migrate: 'alter',

  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true, },
    updatedAt: { type: 'number', autoUpdatedAt: true, },
    id: { type: 'number', autoIncrement: true, },
  },

  // overriden by .env
  dataEncryptionKeys: {
    default: 'HOOtfAPUZ6g8OoAurmJx1KOzZUfSwVmfzCUilfU9TVQ='
  },

  cascadeOnDestroy: true
};
