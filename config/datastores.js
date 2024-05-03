
module.exports.datastores = {
  default: {
    adapter: require('sails-postgresql'),
    url: `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/chain_chomp`,
    ssl: process.env.POSTGRES_SSL === 'true' ? true : false,
  },
};
