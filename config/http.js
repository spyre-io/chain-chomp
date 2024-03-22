const { v4: uuidv4 } = require('uuid');

module.exports.http = {

  middleware: {
    // TODO: REMOVE IN PROD
    cors: (req, res, next) => {
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');

      next();
    },

    logRequest: (req, res, next) => {
      const requestId = uuidv4();
      req.meta = () => ({ requestId, url: req.url, });

      // log before controller
      Logger.debug(`[${requestId}][Start] Received ${req.method} request.`, { ...req.meta(), });

      // log after controller
      res.on('finish', () => Logger.debug(`[${requestId}][Finish] ${res.statusCode} sent.`, { ...req.meta(), }));
      
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
