"use strict";
/**
 * @copyright © 2018 Copyright dphone.com
 * @date 2020-08-15
 */
Object.defineProperty(exports, "__esModule", { value: true });
const bitcoin = require("bitcoinjs-lib");
const bitcoinjs_lib_1 = require("bitcoinjs-lib");
const bitcoinjs_lib_2 = require("bitcoinjs-lib");
const bitcoinjs_lib_3 = require("bitcoinjs-lib");
// import * as classify from 'bitcoinjs-lib/types/classify';
const classify = require('bitcoinjs-lib/src/classify');
// import * as types from 'bitcoinjs-lib/types/types';
const types = require('bitcoinjs-lib/src/types');
// import * as bcrypto from 'bitcoinjs-lib/types/crypto';
const bcrypto = require('bitcoinjs-lib/src/crypto');
const SCRIPT_TYPES = classify.types;
const typeforce = require('typeforce');
function canSign(input) {
    return (input.signScript !== undefined &&
        input.signType !== undefined &&
        input.pubkeys !== undefined &&
        input.signatures !== undefined &&
        input.signatures.length === input.pubkeys.length &&
        input.pubkeys.length > 0 &&
        (input.hasWitness === false || input.value !== undefined));
}
function expandOutput(script, ourPubKey) {
    typeforce(types.Buffer, script);
    const type = classify.output(script);
    switch (type) {
        case SCRIPT_TYPES.P2PKH: {
            if (!ourPubKey)
                return { type };
            // does our hash160(pubKey) match the output scripts?
            const pkh1 = bitcoinjs_lib_2.payments.p2pkh({ output: script }).hash;
            const pkh2 = bcrypto.hash160(ourPubKey);
            if (!pkh1.equals(pkh2))
                return { type };
            return {
                type,
                pubkeys: [ourPubKey],
                signatures: [undefined],
            };
        }
        case SCRIPT_TYPES.P2WPKH: {
            if (!ourPubKey)
                return { type };
            // does our hash160(pubKey) match the output scripts?
            const wpkh1 = bitcoinjs_lib_2.payments.p2wpkh({ output: script }).hash;
            const wpkh2 = bcrypto.hash160(ourPubKey);
            if (!wpkh1.equals(wpkh2))
                return { type };
            return {
                type,
                pubkeys: [ourPubKey],
                signatures: [undefined],
            };
        }
        case SCRIPT_TYPES.P2PK: {
            const p2pk = bitcoinjs_lib_2.payments.p2pk({ output: script });
            return {
                type,
                pubkeys: [p2pk.pubkey],
                signatures: [undefined],
            };
        }
        case SCRIPT_TYPES.P2MS: {
            const p2ms = bitcoinjs_lib_2.payments.p2ms({ output: script });
            return {
                type,
                pubkeys: p2ms.pubkeys,
                signatures: p2ms.pubkeys.map(() => undefined),
                maxSignatures: p2ms.m,
            };
        }
    }
    return { type };
}
function prepareInput(input, ourPubKey, redeemScript, witnessScript) {
    if (redeemScript && witnessScript) {
        const p2wsh = bitcoinjs_lib_2.payments.p2wsh({
            redeem: { output: witnessScript },
        });
        const p2wshAlt = bitcoinjs_lib_2.payments.p2wsh({ output: redeemScript });
        const p2sh = bitcoinjs_lib_2.payments.p2sh({ redeem: { output: redeemScript } });
        const p2shAlt = bitcoinjs_lib_2.payments.p2sh({ redeem: p2wsh });
        // enforces P2SH(P2WSH(...))
        if (!p2wsh.hash.equals(p2wshAlt.hash))
            throw new Error('Witness script inconsistent with prevOutScript');
        if (!p2sh.hash.equals(p2shAlt.hash))
            throw new Error('Redeem script inconsistent with prevOutScript');
        const expanded = expandOutput(p2wsh.redeem.output, ourPubKey);
        if (!expanded.pubkeys)
            throw new Error(expanded.type +
                ' not supported as witnessScript (' +
                bitcoinjs_lib_3.script.toASM(witnessScript) +
                ')');
        if (input.signatures && input.signatures.some(x => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        const signScript = witnessScript;
        if (expanded.type === SCRIPT_TYPES.P2WPKH)
            throw new Error('P2SH(P2WSH(P2WPKH)) is a consensus failure');
        return {
            redeemScript,
            redeemScriptType: SCRIPT_TYPES.P2WSH,
            witnessScript,
            witnessScriptType: expanded.type,
            prevOutType: SCRIPT_TYPES.P2SH,
            prevOutScript: p2sh.output,
            hasWitness: true,
            signScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
        };
    }
    if (redeemScript) {
        const p2sh = bitcoinjs_lib_2.payments.p2sh({ redeem: { output: redeemScript } });
        if (input.prevOutScript) {
            let p2shAlt;
            try {
                p2shAlt = bitcoinjs_lib_2.payments.p2sh({ output: input.prevOutScript });
            }
            catch (e) {
                throw new Error('PrevOutScript must be P2SH');
            }
            if (!p2sh.hash.equals(p2shAlt.hash))
                throw new Error('Redeem script inconsistent with prevOutScript');
        }
        const expanded = expandOutput(p2sh.redeem.output, ourPubKey);
        if (!expanded.pubkeys)
            throw new Error(expanded.type +
                ' not supported as redeemScript (' +
                bitcoinjs_lib_3.script.toASM(redeemScript) +
                ')');
        if (input.signatures && input.signatures.some(x => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        let signScript = redeemScript;
        if (expanded.type === SCRIPT_TYPES.P2WPKH) {
            signScript = bitcoinjs_lib_2.payments.p2pkh({ pubkey: expanded.pubkeys[0] }).output;
        }
        return {
            redeemScript,
            redeemScriptType: expanded.type,
            prevOutType: SCRIPT_TYPES.P2SH,
            prevOutScript: p2sh.output,
            hasWitness: expanded.type === SCRIPT_TYPES.P2WPKH,
            signScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
        };
    }
    if (witnessScript) {
        const p2wsh = bitcoinjs_lib_2.payments.p2wsh({ redeem: { output: witnessScript } });
        if (input.prevOutScript) {
            const p2wshAlt = bitcoinjs_lib_2.payments.p2wsh({ output: input.prevOutScript });
            if (!p2wsh.hash.equals(p2wshAlt.hash))
                throw new Error('Witness script inconsistent with prevOutScript');
        }
        const expanded = expandOutput(p2wsh.redeem.output, ourPubKey);
        if (!expanded.pubkeys)
            throw new Error(expanded.type +
                ' not supported as witnessScript (' +
                bitcoinjs_lib_3.script.toASM(witnessScript) +
                ')');
        if (input.signatures && input.signatures.some(x => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        const signScript = witnessScript;
        if (expanded.type === SCRIPT_TYPES.P2WPKH)
            throw new Error('P2WSH(P2WPKH) is a consensus failure');
        return {
            witnessScript,
            witnessScriptType: expanded.type,
            prevOutType: SCRIPT_TYPES.P2WSH,
            prevOutScript: p2wsh.output,
            hasWitness: true,
            signScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
        };
    }
    if (input.prevOutType && input.prevOutScript) {
        // embedded scripts are not possible without extra information
        if (input.prevOutType === SCRIPT_TYPES.P2SH)
            throw new Error('PrevOutScript is ' + input.prevOutType + ', requires redeemScript');
        if (input.prevOutType === SCRIPT_TYPES.P2WSH)
            throw new Error('PrevOutScript is ' + input.prevOutType + ', requires witnessScript');
        if (!input.prevOutScript)
            throw new Error('PrevOutScript is missing');
        const expanded = expandOutput(input.prevOutScript, ourPubKey);
        if (!expanded.pubkeys)
            throw new Error(expanded.type +
                ' not supported (' +
                bitcoinjs_lib_3.script.toASM(input.prevOutScript) +
                ')');
        if (input.signatures && input.signatures.some(x => x !== undefined)) {
            expanded.signatures = input.signatures;
        }
        let signScript = input.prevOutScript;
        if (expanded.type === SCRIPT_TYPES.P2WPKH) {
            signScript = bitcoinjs_lib_2.payments.p2pkh({ pubkey: expanded.pubkeys[0] })
                .output;
        }
        return {
            prevOutType: expanded.type,
            prevOutScript: input.prevOutScript,
            hasWitness: expanded.type === SCRIPT_TYPES.P2WPKH,
            signScript,
            signType: expanded.type,
            pubkeys: expanded.pubkeys,
            signatures: expanded.signatures,
            maxSignatures: expanded.maxSignatures,
        };
    }
    const prevOutScript = bitcoinjs_lib_2.payments.p2pkh({ pubkey: ourPubKey }).output;
    return {
        prevOutType: SCRIPT_TYPES.P2PKH,
        prevOutScript,
        hasWitness: false,
        signScript: prevOutScript,
        signType: SCRIPT_TYPES.P2PKH,
        pubkeys: [ourPubKey],
        signatures: [undefined],
    };
}
class TxBuilder extends bitcoin.TransactionBuilder {
    static fromTransaction(transaction, network) {
        var tb = bitcoin.TransactionBuilder.fromTransaction(transaction, network);
        tb.__proto__ = TxBuilder.prototype;
        return tb;
    }
    async signAsync(index, signer) {
        await this._trySign(this._getSigningData(this.network, this.__INPUTS, this.__needsOutputs.bind(this), this.__TX, index, signer, this.__USE_LOW_R));
    }
    async _trySign({ input, ourPubKey, keyPair, signatureHash, hashType, useLowR, }) {
        // enforce in order signing of public keys
        let signed = false;
        for (const [i, pubKey] of input.pubkeys.entries()) {
            if (!ourPubKey.equals(pubKey))
                continue;
            if (input.signatures[i])
                throw new Error('Signature already exists');
            // TODO: add tests
            if (ourPubKey.length !== 33 && input.hasWitness) {
                throw new Error('BIP143 rejects uncompressed public keys in P2WPKH or P2WSH');
            }
            const signature = await keyPair.sign(signatureHash, useLowR);
            input.signatures[i] = bitcoinjs_lib_3.script.signature.encode(signature, hashType);
            signed = true;
        }
        if (!signed)
            throw new Error('Key pair cannot sign for this input');
    }
    _getSigningData(network, inputs, needsOutputs, tx, signParams, keyPair, useLowR) {
        let vin = signParams;
        // TODO: remove keyPair.network matching in 4.0.0
        if (keyPair.network && keyPair.network !== network)
            throw new TypeError('Inconsistent network');
        if (!inputs[vin])
            throw new Error('No input at index: ' + vin);
        var hashType = bitcoinjs_lib_1.Transaction.SIGHASH_ALL;
        if (needsOutputs(hashType))
            throw new Error('Transaction needs outputs');
        const input = inputs[vin];
        const ourPubKey = keyPair.publicKey;
        if (!canSign(input)) {
            if (!canSign(input)) {
                const prepared = prepareInput(input, ourPubKey);
                // updates inline
                Object.assign(input, prepared);
            }
            if (!canSign(input))
                throw Error(input.prevOutType + ' not supported');
        }
        // ready to sign
        let signatureHash;
        if (input.hasWitness) {
            signatureHash = tx.hashForWitnessV0(vin, input.signScript, input.value, hashType);
        }
        else {
            signatureHash = tx.hashForSignature(vin, input.signScript, hashType);
        }
        return {
            input,
            ourPubKey,
            keyPair,
            signatureHash,
            hashType,
            useLowR: !!useLowR,
        };
    }
}
exports.default = TxBuilder;
