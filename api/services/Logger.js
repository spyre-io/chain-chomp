const winston = require('winston');

const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
});

logger.add(new winston.transports.Console({
  format: winston.format.colorize(),
}));

module.exports = logger;
