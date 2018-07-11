const readlineAsync = require('readline-async');
const btc = require('./btcQuery');

( async () => {
  const sendToAddress =  await btc.query({ method: 'getnewaddress' });

  console.log('Enter amount');
  const amountToSend = await readlineAsync();
  const fee = 0.0001;

  const changeAddress = await btc.query({ method: 'getrawchangeaddress' });
  const unspentList = await btc.query({ method: 'listunspent' });  

  let sum = 0;
  const transactionsToUse = unspentList.sort((tx1, tx2) => (
    tx2.confirmations - tx1.confirmations
  )).filter(tx => {
    if (tx.vout === 0) {
      const oldSum = sum;
      sum += tx.amount;
      return oldSum <= amountToSend;
    }
    return false;
  });
  const rawTxInputs = transactionsToUse.map(tx => (
    {
      txid: tx.txid,
      vout: tx.vout
    }
  ));
  const txsSum = transactionsToUse.reduce((acc, tx) => acc + tx.amount, 0);
  const rawTxOutputs = {
    [sendToAddress]: amountToSend,
    [changeAddress]: txsSum - amountToSend - fee
  };
  
  const rawTransaction = await btc.query({ method: 'createrawtransaction', params: [
    rawTxInputs,
    rawTxOutputs
  ]});

  const rawTxInfo = await btc.query({ method: 'decoderawtransaction', params: [rawTransaction] });
  const signedTx = await btc.query({ method: 'signrawtransaction', params: [rawTransaction] });
  const sentTx = await btc.query({ method: 'sendrawtransaction', params: [signedTx.hex] });
  console.log({
    'Transaction info': JSON.stringify(rawTxInfo),
    'Sent transaction hash': sentTx
  });

})();