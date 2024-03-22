const { Web3 } = require('web3');
const { BigNumber } = require('ethers');

// we just want to grab this once
let _w3;

// [name]: { addr, contract: web3.eth.Contract, }
const _contracts = {};

const getWeb3 = () => {
  if (!_w3) {
    Logger.info(`Creating new Web3 instance for '${sails.config.custom.blockchain.rpc}'.`)

    _w3 = new Web3(sails.config.custom.blockchain.rpc);
    _w3.eth.handleRevert = true
    
    // add wallet
    _w3.eth.accounts.wallet.add(sails.config.custom.blockchain.wallets.owner.pk);
    _w3.eth.defaultAccount = sails.config.custom.blockchain.wallets.owner.addr;

    Logger.info(`Configured wallet for ${_w3.eth.accounts.wallet[0].address}.`);

    // load contracts
    for (const [name, { addr, abi, }] of Object.entries(sails.config.custom.blockchain.contracts)) {
      Logger.info(`Loading contract '${name}' at '${addr}'.`);

      _contracts[name] = {
        addr,
        contract: new _w3.eth.Contract(
          abi,
          addr,
          {
            // todo: poll and update this
            // gasPrice: '160000000000',
            from: sails.config.custom.blockchain.wallets.owner.addr,
          },
        ),
      };
    }
  }

  return _w3;
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
    Logger.error(`[Web3Service][processTxnQueue] Error processing txn queue: ${error}.`);
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

const getHangmanBalance = async (addr) => await _contracts["hangman"].contract.methods.balances(addr).call();

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

const promiseHandler = ({ messageFormatter, txn, stake1, stake2, signedMsg1, signedMsg2, matchId, winner }) => (resolve, reject) => {
  _contracts["hangman"].contract.methods
    .processStakedMatch(
      stake1,
      stake2,
      signedMsg1,
      signedMsg2,
      matchId,
      winner,
    )
    .send()
    .on('sent', (data) => {
      Logger.info(messageFormatter(`Sent txn: ${data}.`));

      queueTxnMutation(
        txn.id,
        async () => {
          await Txn
            .updateOne({ id: txn.id })
            .set({ status: 'sent' });

          txn.status = 'sent';
          resolve();
        },
      );
    })
    .on('transactionHash', (txnHash) => {
      Logger.info(messageFormatter(`Transaction hash: ${txnHash}.`));

      queueTxnMutation(
        txn.id,
        async () => {
          await Txn
            .updateOne({ id: txn.id })
            .set({
              status: 'waiting-for-confirmation',
              txnHash,
            });
          
          txn.status = 'waiting-for-confirmation';
        },
      );
    })
    .on('receipt', (receipt) => {
      const { transactionHash, blockHash, contractAddress, } = receipt;
      const reducedReceipt = { transactionHash, blockHash, contractAddress, };

      Logger.info(messageFormatter(`Receipt: ${JSON.stringify(reducedReceipt)}.`));

      queueTxnMutation(
        txn.id,
        async () => {
          await Txn
            .updateOne({ id: txn.id })
            .set({
              status: 'success',
              receipt: reducedReceipt,
            });
          
          txn.status = 'success';
        },
      );
    })
    .on('error', (error) => {
      Logger.error(messageFormatter(`ProcessStakedMatch error! Moving from '${txn.status}' -> 'failure': ${error}.`));

      queueTxnMutation(
        txn.id,
        async () => {
          Logger.info(messageFormatter(`Updating txn status to 'error'.`));

          await Txn
            .updateOne({ id: txn.id })
            .set({
              status: 'failure',
              error: error.message,
            });
          
          if (txn.status === 'not-started') {
            Logger.info(messageFormatter(`Txn was never sent, so we're rejecting the promise.`));

            reject(error);
          } else {
            Logger.info(messageFormatter(`Txn was already handled somewhere else?`));
          }
        },
      );
    })
    .catch(() => {
      // already handled by 'error' handler
    });
};

module.exports = {
  init: async () => {
    getWeb3();

    Logger.info(`Web3 initialized.`);
  },

  getBalance: async ({ coin, addr, }) => {
    if ("native" === coin) {
      const w3 = getWeb3();

      return await w3.eth.getBalance(addr);
    }

    if ("hangman" === coin) {
      return getHangmanBalance(addr);
    }

    return await _contracts[coin].contract.methods.balanceOf(addr).call();
  },

  getWithdrawAfter: async ({ addr, }) => {
    return await _contracts["hangman"].contract.methods.withdrawAfter(addr).call();
  },

  getNonce: async ({ addr, }) => {
    return await _contracts["hangman"].contract.methods.nonces(addr).call();
  },

  stakeSignedCheck: async (params) => {
    const { stake, sig, } = params;

    const message = (msg) => `[Web3Service][StakeSignedCheck] ${msg}`;
    Logger.info(message(`Submitting ${JSON.stringify(params, null, 2)}`));

    return await _contracts["hangman"].contract.methods.stakeSignedCheck(
      stake,
      sig,
    ).call();
  },

  submit: async (params) => {
    const txn = await Txn.create({
      method: 'submit',
      status: 'not-started',
      params,
    }).fetch();

    const message = (msg) => `[Web3Service][Submit][Txn.id=${txn.id}] ${msg}`;

    Logger.info(message(`Submitting txn.`));

    try {
      await Promise.all([
        validateStake(params.stake1),
        validateStake(params.stake2),
      ]);
    } catch (error) {
      Logger.error(message(`Error validating stakes: ${error.message}.`));

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
    
    
    const promise = new Promise(promiseHandler({ ...params, txn, messageFormatter: message, }));
    try {
      await promise;
    } catch (error) {
      Logger.error(message(`Error submitting txn: ${error}.`));

      return txn;
    }

    Logger.info(message(`Successfully sent transaction.`));

    return txn;
  },

  withdraw: async ({ withdraw, signature }) => {
    Logger.info('withdraw', withdraw);
    Logger.info('signature', signature);

    return await _contracts["hangman"].contract.methods.withdrawTokenAdmin(
      withdraw,
      signature,
    ).send();
  },
};
