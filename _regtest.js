
var RegtestUtils = require('regtest-client').RegtestUtils;

const APIPASS = process.env.APIPASS || 'satoshi';
const APIURL = process.env.APIURL || 'https://regtest.bitbank.cc/1';

exports.regtestUtils = new RegtestUtils({ APIPASS, APIURL });
