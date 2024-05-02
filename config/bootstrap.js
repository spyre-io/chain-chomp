require('dotenv').config();

module.exports.bootstrap = async function() {
  await Web3Service.init(Logger);
};
