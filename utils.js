'use strict';

//const KeyVault = require('./azure/key_vault')

const IsProd = (process.env.NODE_ENV === 'production');
const IsBeta = process.env.IS_BETA === '1';
const config = require('dotenv-defaults').config({
    //path: path.resolve('.env'),
    encoding: 'utf8',
    defaults: require('path').resolve('.env.defaults')
}).parsed;
let appId;

class Utils {
    // Initialize Globals
    constructor() {
        (async () =>{
            appId = config.APPID;
        })();
    }

    IsProd() {
        return IsProd && !IsBeta;
    }

    IsBeta() {
        return IsBeta;
    }

    toBool(val) {
        return (/^(true|1|on)$/i).test(val);
    }
}

module.exports = new Utils();