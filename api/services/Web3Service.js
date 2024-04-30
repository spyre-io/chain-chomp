const { BigNumber } = require("@ethersproject/bignumber");
const { createPublicClient, createWalletClient, fallback, http, webSocket, getContract, decodeErrorResult } = require("viem");
const { privateKeyToAccount } = require("viem/accounts");

let defaultLogger;

// we just want to grab these once
let _publicClient, _walletClient, _account;

// [name]: { addr, contract: web3.eth.Contract, }
const _contracts = {};

const initWeb3 = (logger) => {
  if (_walletClient) {
    logger.warn('Web3 already initialized.');
    return;
  }

  const ownerAddr = sails.config.custom.blockchain.wallets.owner.addr;
  const ownerPk = sails.config.custom.blockchain.wallets.owner.pk;
  const rpcs = sails.config.custom.blockchain.rpcs;
  const chain = sails.config.custom.blockchain.chain;
  const contracts = sails.config.custom.blockchain.contracts;

  logger.info(`Configuring wallet for ${ownerAddr}.`);

  _account = privateKeyToAccount(ownerPk);

  logger.info(`Creating new Web3 instance.`)

  _walletClient = createWalletClient({
    account: _account,
    chain: chain,
    transport: fallback([
      ...rpcs.http.map((url) => http(url)),
      ...rpcs.ws.map((url) => webSocket(url)),
    ]),
  });

  _publicClient = createPublicClient({
    chain: chain,
    transport: fallback([
      ...rpcs.http.map((url) => http(url)),
      ...rpcs.ws.map((url) => webSocket(url)),
    ]),
  })

  // load contracts
  for (const [name, { addr, abi, }] of Object.entries(contracts)) {
    logger.info(`Loading contract '${name}' at '${addr}'.`);

    _contracts[name] = {
      addr,
      abi,
      contract: getContract({
        client: {
          public: _publicClient,
          wallet: _walletClient,
        },
        address: addr,
        abi,
      }),
    };
  }
};

const _txnMutationsById = {
  // [txnId]: { queue: [], current: Promise },
};

const processTxnQueue = async (txnId) => {
  const record = _txnMutationsById[txnId];
  if (!record || record.current) {
    return;
  }

  const fn = record.queue.shift();
  if (!fn) {
    delete _txnMutationsById[txnId];
    return;
  }

  record.current = fn();
  try {
    await record.current;
  } catch (error) {
    defaultLogger.error(`Error processing txn queue: ${error}.`, { method: 'processTxnQueue' });
  }
  record.current = null;

  processTxnQueue(txnId);
};

const queueTxnMutation = (txnId, fn) => {
  if (!_txnMutationsById[txnId]) {
    _txnMutationsById[txnId] = {
      queue: [],
      current: null,
    };
  }

  const record = _txnMutationsById[txnId];
  record.queue.push(fn);

  processTxnQueue(txnId);
};

const getHangmanBalance = async (addr) => {
  return await _contracts.hangman.contract.read.balances([addr]);
};

const validateStake = async ({ user, amount, fee, expiry, }) => {
  // get hangman balance of user
  const balance = await getHangmanBalance(user);
  const balanceBig = BigNumber.from(balance);

  // check if balance is sufficient
  const feeBig = BigNumber.from(fee);
  const amountBig = BigNumber.from(amount);
  const total = feeBig.add(amountBig);

  if (balanceBig.lt(total)) {
    throw new Error(`Insufficient balance for ${user}. Have ${balance.toString()}, need ${total.toString()}.`);
  }

  // check expiry
  const now = Math.floor(Date.now() / 1000);
  const expiryInt = parseInt(expiry);
  if (expiryInt < now) {
    throw new Error(`Expiry is in the past for ${user}. Now: ${now}, expiry: ${expiryInt}.`);
  }
};

const getErrorStringFromViemError = (error) => {
  const reasons = [];
  if (error.walk) {
    error.walk((e) => {
      // this handles reasons like "revert: Reason string"
      if (e.data) {
        try {
          const result = decodeErrorResult({
            abi: _contracts.hangman.abi,
            data: e.data,
          });

          reasons.push(result.args[0]);
        } catch (error) {
          logger.warn(`Error decoding error result: ${error}.`);

          return;
        }
      }
    });
  } else {
    reasons.push(error.message);
  }

  return reasons.join(', ');
};

const promiseHandler = (logger, { txn, stake1, stake2, signedMsg1, signedMsg2, matchId, winner }) => async (resolve, reject) => {
  const fail = (message) => {
    queueTxnMutation(
      txn.id,
      async () => {
        logger.info(`Updating txn status to 'error'.`);

        await Txn
          .updateOne({ id: txn.id })
          .set({
            status: 'failure',
            error: message,
          });
        
        if (txn.status === 'not-started') {
          logger.info(`Txn was never sent, so we're rejecting the promise.`);

          reject(message);
        } else {
          logger.info(`Txn promise was already handled somewhere else?`);
        }
      },
    );
  };

  let hash;
  try {
    hash = await _contracts.hangman.contract.write.processStakedMatch([
      stake1,
      stake2,
      signedMsg1,
      signedMsg2,
      matchId,
      winner,
    ]);
  } catch (error) {
    fail(getErrorStringFromViemError(error));
    return;
  }

  logger = logger.child({ txnHash: hash, });
  logger.info(`Sent txn. Waiting for confirmation.`);

  // queue a mutation and resolve the promise
  queueTxnMutation(
    txn.id,
    async () => {
      await Txn
        .updateOne({ id: txn.id })
        .set({
          status: 'waiting-for-confirmation',
          txnHash: hash,
        });
      
      txn.status = 'waiting-for-confirmation';
      resolve();
    },
  );

  // wait for the transaction to be mined
  let receipt;
  try {
    receipt = await _publicClient.waitForTransactionReceipt({ hash });
  } catch (error) {
    fail(getErrorStringFromViemError(error));
    return;
  }

  logger.info(`Transaction mined.`);

  const receiptToPlainObject = ({
    blockHash,
    blockNumber,
    contractAddress,
    effectiveGasPrice,
    from,
    gasUsed,
    status,
    to,
    transactionHash,
    transactionIndex,
    type,
  }) => ({
    contractAddress, from, status, to,
    transactionHash, transactionIndex, type,
    blockHash: blockHash.toString(),
    blockNumber: blockNumber.toString(),
    effectiveGasPrice: effectiveGasPrice.toString(),
    gasUsed: gasUsed.toString(),
  });
  
  queueTxnMutation(
    txn.id,
    async () => {
      await Txn
        .updateOne({ id: txn.id })
        .set({
          status: 'success',
          receipt: receiptToPlainObject(receipt),
        });
      
      txn.status = 'success';
    },
  );
};

module.exports = {
  init: async () => {
    initWeb3(Logger.default);

    defaultLogger = Logger.default.child({ system: 'Web3Service', });
    defaultLogger.info(`Web3 initialized.`);
  },

  getBalance: async (logger, { coin, addr, }) => {
    logger.info(`Getting balance for ${coin} at ${addr}.`);

    if ("native" === coin) {
      return await _publicClient.getBalance({ address: addr });
    }

    if ("hangman" === coin) {
      return getHangmanBalance(addr);
    }

    return await _contracts[coin].contract.read.balanceOf([addr]);
  },

  getWithdrawAfter: async (logger, { addr, }) => {
    logger.info(`Getting withdrawAfter for ${addr}.`);

    return await _contracts.hangman.contract.read.withdrawAfter([addr]);
  },

  getNonce: async (logger, { addr, }) => {
    logger.info(`Getting nonce for ${addr}.`);

    return await _contracts.hangman.contract.read.nonces([addr]);
  },

  stakeSignedCheck: async (logger, params) => {
    logger.info(`Checking signed stake: ${JSON.stringify(params, null, 2)}.`);

    const { stake, sig, } = params;

    return await _contracts.hangman.contract.read.stakeSignedCheck([
      stake,
      sig,
    ]);
  },

  submit: async (parentLogger, params) => {
    parentLogger.info(`Submitting ${JSON.stringify(params, null, 2)}.`);

    const txn = await Txn.create({
      method: 'submit',
      status: 'not-started',
      params,
    }).fetch();

    const logger = parentLogger.child({ txnId: txn.id, });
    logger.info(`Submitting txn.`);

    try {
      await Promise.all([
        validateStake(params.stake1),
        validateStake(params.stake2),
      ]);
    } catch (error) {
      logger.error(`Error validating stakes: ${error.message}.`);

      await Txn
        .updateOne({ id: txn.id })
        .set({
          status: 'failure',
          error: error.message,
        });
      txn.status = 'failure';
      txn.error = error.message;

      return txn; 
    }
    
    const promise = new Promise(promiseHandler(logger, { ...params, txn, }));
    try {
      await promise;
    } catch (error) {
      logger.error(`Error submitting txn: ${error}.`);

      return txn;
    }

    logger.info(`Successfully sent transaction.`);

    return txn;
  },

  withdraw: async (logger, { withdraw, signature }) => {
    logger.info('Starting withdraw.', { withdraw, signature, });

    return await _contracts.hangman.contract.write.withdrawTokenAdmin([
      withdraw,
      signature,
    ]);
  },
};
