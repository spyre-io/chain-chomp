const { v4: uuidv4 } = require('uuid');

module.exports.http = {
  middleware: {
    // TODO: REMOVE IN PROD
    cors: (req, res, next) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Req-Id');
      res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

      next();
    },

    logRequest: (req, res, next) => {
      // read x-req-id from headers
      const reqId = req.headers['x-req-id'] || uuidv4();
      req.logger = Logger.child({
        reqId,
        url: req.url,
        method: req.method,
      });

      const ignored = req.url === '/v1/healthcheck';

      // log before controller
      if (!ignored) {
        req.logger.debug(`[Start] Received request.`);

        // log after controller
        res.on('finish', () => req.logger.debug(`[Finish] ${res.statusCode} sent.`));
      }
      
      next();
    },

    order: [
       'bodyParser',
       'cors',
       'logRequest',
       'router',
    ],
  },

};
