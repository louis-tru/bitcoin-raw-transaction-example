
var fs = require('fs');
var bitcoin = require('bitcoinjs-lib');

function txHexToJSON(hex) { // debugger
	var tx = bitcoin.Transaction.fromHex(hex);

	return {
		version: tx.version,
		locktime: tx.locktime,
		ins: tx.ins.map((e)=>{
			return {
				hash:  e.hash.toString('hex'),
				index: e.index,
				script: e.script.toString('hex'),
				sequence: e.sequence,
				witness: e.witness.toString('hex'),
			}
		}),
		outs: tx.outs.map((e)=>{
			return {
				script: e.script.toString('hex'),
				value: e.value,
			};
		}),
	};
}

var r = txHexToJSON(fs.readFileSync(`${__dirname}/raw-tr.hex`, 'utf8'));

fs.writeFileSync(`${__dirname}/raw-tr.json`, JSON.stringify(r, null, 2));

var r = txHexToJSON(fs.readFileSync(`${__dirname}/raw-tr2.hex`, 'utf8'));

fs.writeFileSync(`${__dirname}/raw-tr2.json`, JSON.stringify(r, null, 2));