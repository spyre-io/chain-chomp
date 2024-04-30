const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug',
  defaultMeta: {
    service: 'chomper',
  },
  format: process.env.LOCAL === 'true' ? winston.format.cli() : winston.format.json(),
  transports:[new winston.transports.Console()],
});

module.exports = {
  default: logger,
  child: (meta) => logger.child(meta),
};
