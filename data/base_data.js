'use strict';

const path = require('path');
const config = require('dotenv-defaults').config({
    //path: path.resolve('.env'),
    encoding: 'utf8',
    defaults: path.resolve('.env.defaults')
}).parsed;
const tedious = require('tedious');

class BaseData {
    async getConnection() {
        return new tedious.Connection({
            server: config.TEASERDATABASESERVER,
            authentication: {
                options: {
                    userName: config.TEASERDATABASEUSER,
                    password: config.TEASERDATABASEPASS
                },
                type: "default"
            },
            options: {
                database: config.TEASERDATABASENAME,
                encrypt: true,
                rowCollectionOnRequestCompletion: true
            }
        });
    }
}

module.exports = BaseData;