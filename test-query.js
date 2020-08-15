
const readlineAsync = require('readline-async');
const rpc = require('./rpc');

(async () => {
	const sendToAddress =  await rpc({ method: 'getnewaddress' });

	console.log('Enter amount');
	const amountToSend = await readlineAsync();
	const fee = 0.0001;

	const changeAddress = await rpc({ method: 'getrawchangeaddress' });
	const unspentList = await rpc({ method: 'listunspent' });

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
	
	const rawTransaction = await rpc({ method: 'createrawtransaction', params: [
		rawTxInputs,
		rawTxOutputs
	]});

	const rawTxInfo = await rpc({ method: 'decoderawtransaction', params: [rawTransaction] });
	const signedTx = await rpc({ method: 'signrawtransaction', params: [rawTransaction] });
	const sentTx = await rpc({ method: 'sendrawtransaction', params: [signedTx.hex] });
	console.log({
		'Transaction info': JSON.stringify(rawTxInfo),
		'Sent transaction hash': sentTx
	});

})();