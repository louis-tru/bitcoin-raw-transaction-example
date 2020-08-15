
const readlineAsync = require('readline-async');
const Client = require('bitcoin-core');

const client = new Client({
	version: '0.16.0.0', 
	network: 'regtest',
	port: 18443,
	host: 'localhost',
	username: 'me',
	password: 'mypassword'
});

(async () => {
	//const blockChainInfo = client.getBlockchainInfo();
	//const balance = await client.getBalance();
	//console.log(await client.listUnspent());

	console.log('Please, enter Recepient address or generate new one (press "n")');
	const addrInput = await readlineAsync();
	const sendToAddress = addrInput === 'n' ? await client.getNewAddress() : addrInput;

	console.log('Enter amount');
	const amountToSend = await readlineAsync();

	console.log('Enter fee');
	const fee = await readlineAsync();
	
	//const texid = await client.sendToAddress(sendToAddress, amountInput);
	//console.log(texid);
	//console.log(await client.getBalance());

	// Raw transaction
	
	// Generate return address
	const changeAddress = await client.getRawChangeAddress();
	const unspentList = await client.listUnspent();

	let sum = 0;
	const transactionsToUse = unspentList.sort((tx1, tx2) => (
		// Sort: more confirmations first
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

	const rawTransaction = await client.createRawTransaction({
		inputs: rawTxInputs,
		outputs: rawTxOutputs
	});

	const rawTxInfo = await client.decodeRawTransaction(rawTransaction);
	// Sign raw transaction
	const signedTx = await client.signRawTransaction(rawTransaction);
	// Send raw transaction
	const sentTx = await client.sendRawTransaction(signedTx.hex);
	console.log({
		'Transaction info': JSON.stringify(rawTxInfo),
		'Sent transaction hash': sentTx
	});

})();