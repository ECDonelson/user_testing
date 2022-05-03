'use strict';

const tedious = require('tedious');
const BaseData = require('../base_data');

class UserTestingQueue extends BaseData {
    insertUserTest(data, fileInfo) {
        return new Promise((res, rej) => {
            super.getConnection().then(connection => {
                connection.on('connect', function (err) {
                    if (err) {
                        console.log(err);
                        rej(err);
                    }
                    const request = new tedious.Request(`InsertUserTest`, function (err, rowCount, rows) {
                        if (err) {
                            console.log(err);
                            rej(err);
                        };
                        connection.close();
                    });

                    let title = { name: 'title', type: tedious.TYPES.VarChar, value: data[0].value.toLowerCase().replaceAll(' ', '_') };
                    let dateSubmitted = { name: 'date_submitted_string', type: tedious.TYPES.NVarChar, value: fileInfo.dateSubmitted };
                    let userAlias = { name: 'userAlias', type: tedious.TYPES.VarChar, value: data.userInfo.UserEmail };
                    let uuid = { name: 'uuid', type: tedious.TYPES.VarChar, value: fileInfo.uuid };

                    let params = [title, userAlias, dateSubmitted, uuid];

                    params.map(param => {
                        request.addParameter(param.name, param.type, param.value);
                    });

                    request.on('doneProc', (rowCount, more, status, rows) => {
                        if (!more) {
                            res(status);
                        }
                    });
                    connection.callProcedure(request);
                });
                connection.connect();
            });
        });
    }
}

module.exports = new UserTestingQueue();