
module.exports.routes = {
  'GET /v1/healthcheck': 'v1/healthcheck',
  'GET /v1/balance/:coin/:addr': 'v1/get-balance',
  'GET /v1/withdraw/:addr': 'v1/get-withdraw-after',
  'GET /v1/nonce/:addr': 'v1/get-nonce',
  
  'GET /v1/txn/:txnId': 'v1/get-txn',
  'GET /v1/txn': 'v1/find-txns',

  'POST /v1/submit/stake': 'v1/submit-stake',
  'POST /v1/submit/permit': 'v1/submit-permit',
  'POST /v1/withdraw': 'v1/withdraw',
  'POST /v1/check-stake': 'v1/check-stake',
};
