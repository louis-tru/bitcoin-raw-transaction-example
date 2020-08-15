
var bitcoin = require('bitcoinjs-lib');
var fs = require('fs');
var btc = require('crypto-tx/btc');
var buffer = require('somes/buffer').default;

function signTransaction(txHex, privateKey) {
	var { mainnet } = btc.parseWIF(buffer.from(privateKey, 'base58'));
	var network = mainnet ? bitcoin.networks.mainnet: bitcoin.networks.testnet;
	var keyPair = bitcoin.ECPair.fromWIF(privateKey, network);

	var tx = bitcoin.Transaction.fromHex(txHex);
	var txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);

	for (var i = 0; i < tx.ins.length; i++) {
		txb.sign(i, keyPair);
	}

	return txb.build().toHex();
}

function signTransaction2(tx_json, privateKey) {
	var { mainnet } = btc.parseWIF(buffer.from(privateKey, 'base58'));
	var network = mainnet ? bitcoin.networks.mainnet: bitcoin.networks.testnet;
	var keyPair = bitcoin.ECPair.fromWIF(privateKey, network);

	var tx = new bitcoin.Transaction();

	tx.version = tx_json.version;
	tx.locktime = tx_json.locktime;
	
	for (var i of tx_json.ins) {
		tx.addInput(buffer.from(i.hash, 'hex'), i.index, i.sequence);
	}
	for (var o of tx_json.outs) {
		tx.addOutput(buffer.from(o.script, 'hex'), o.value);
	}

	var txb = bitcoin.TransactionBuilder.fromTransaction(tx, network);

	for (var i = 0; i < tx.ins.length; i++) {
		txb.sign(i, keyPair);
	}

	return txb.build().toHex();
}

// privateKey ecb1b5a609eee594fe4322889853e08b32577d68a7e40f2f631f739f3eccc5a8
// publicKey 03e04dbd719474dc76c94506eb24e03d71af2bb3a8a800b9730b5a391bb322044e
// address mtz44F24cdUHA44ntwcfNs7mfFdKzZKYAb
// wif cVWobZH8WMCpdNpBnA8ED2NTbguxAvVmVTZ6mbVc8krumG8RGV5A

// privateKey 6311e0683de24b634dec1375e7f673d002e629d08d5aaff6a6786514d869d088
// publicKey 0268027a4e8f1038af8f1450a755b3b8c99440fcfd62c14a476b58cc238f7475f8
// address mn5A8cWxaUcLQKjAmHPZfXVPNALuvA2ZQ6
// wif cQuHDfpaC17kVWzW9AspcVej6NyDqmv53QtYZn96J25Qw8LQz761

// privateKey 1c236f70ad3db5efd0bd8ffc22acf9c645fc5b1865250c5293b392729ce5f9e5
// publicKey 02fd3d6c4df41f48e1c947f7c0eae8aca21ad7b00c905d02eadce0b8397d1f992e
// address 1D6mEa57zVSy9nJcvzW68VuxCzmZuwX9wL
// wif KxAQdkAwqkeGk6AtzAdwVecg6P64r5p16qhDAKk3X8YThpvPJ1kT

// privateKey 0a0c9e6b58f09d413c1d8d3ff19265e270bf6dc7a123bd916db415731d356614
// publicKey 02826c32531a818994fccc72444789e458ee47ef68a7c39da349f7ea7deb3c391b
// address 1Mjpgtd8a996VCpz1xH1jHPYvBPiFXa8Gd
// wif KwZFBkdzBEVNvwm2kHX8Abs2o9PZcoWnKbhAvaQGQdk3RY2WVxmG

var privateKey = 'cVWobZH8WMCpdNpBnA8ED2NTbguxAvVmVTZ6mbVc8krumG8RGV5A';

var signed_tx = signTransaction(fs.readFileSync(`${__dirname}/raw-tr.hex`, 'utf8'), privateKey);
// var signed_tx = signTransaction2(JSON.parse(fs.readFileSync(`${__dirname}/raw-tr.json`, 'utf8')), privateKey);

fs.writeFileSync(`${__dirname}/raw-tr2.hex`, signed_tx);

console.log('\nSigned transaction using the function:');
console.log(signed_tx);