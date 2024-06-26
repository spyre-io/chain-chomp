
module.exports.models = {

  schema: true,
  migrate: 'safe',

  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true, },
    updatedAt: { type: 'number', autoUpdatedAt: true, },
    id: { type: 'number', autoIncrement: true, },
  },

  dataEncryptionKeys: {
    default: 'HOOtfAPUZ6g8OoAurmJx1KOzZUfSwVmfzCUilfU9TVQ='
  },

  cascadeOnDestroy: true
};
