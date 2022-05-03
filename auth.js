const Utils = require('./utils')
const config = require('dotenv-defaults').config({
    encoding: 'utf8',
    defaults: require('path').resolve('.env.defaults')
}).parsed;
const msal = require('@azure/msal-node');
const scopes = ["User.Read"];
let pca;
let redirectUri;

//if (Utils.IsProd()) {
    redirectUri = 'https://usertestingform.azurewebsites.net/auth/token';
    //dev:  redirectUri = 'http://localhost:8080/auth/token';
//} 
// else {
// }

class Auth {
    constructor() {
        (async function () {
            pca = new msal.ConfidentialClientApplication({
                auth: {
                    authority: "https://login.microsoftonline.com/common",
                    clientId: config.APPID,
                    clientSecret: config.APPPASS,
                }
            });
        })();
    }

    Login(req, res) {
        res.sendFile(require('path').join(__dirname, "login.html"))
    }

    Start(req, res, next) {
        pca.getAuthCodeUrl({
            scopes: scopes,
            redirectUri: redirectUri,
        }).then((response) => {
            res.redirect(response);
        }).catch(err => {
            console.error(err);
            next(err);
        });
    }

    Token(req, res, next) {
        pca.acquireTokenByCode({
            code: req.query.code,
            scopes: scopes,
            redirectUri: redirectUri,
        }).then((response) => {
            console.log(`After token obtained \n ${response}`);

            res.cookie("UserName", response.account.name);
            res.cookie("UserEmail", response.account.username);
            res.cookie("UserId", response.account.tenantId);

            res.sendFile(require('path').join(__dirname, "landing.html"))
        }).catch(err => {
            console.error(err);
            next(err);
            // res.status(500).send(err);
        });
    }

    Logout(req, res) {
        res.cookie("UserName", '');
        res.cookie("UserEmail", '');
        res.cookie("UserId", '');
        res.redirect('/auth/login');
    }
}

module.exports = new Auth();