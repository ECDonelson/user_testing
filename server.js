const auth = require("./auth")
const express = require('express');
const app = express();
const path = require('path');
const docx = require("docx");
const fs = require('fs')
const bodyParser = require('body-parser');
const BlobStorage = require('./azure/blob_storage');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const requestify = require('requestify');
const UserTestingQueue = require('./data/user_testing_queue/data_access');

app.use(express.static(__dirname + '/assets'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );
const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel} = docx;

app.post("/submitForm", async (req, res) => {
    const { formData, formInfo } = req.body.data;
    formData.userInfo = parseHeaders(req.headers.cookie);
    const names = formData.map(e => e.name);
    formInfo.uuid = uuidv4();
    const blob = new BlobStorage();
    const paragraphChildren = [];
    formData.forEach((item, i) => {
        const name = names[i].match(/\[(.*?)\]/) ? names[i].match(/\[(.*?)\]/)[1] : names[i];
        const formattedName = formatName(name).replace(/_/g, " ");
        const value = formData[i].value;
        if (name !== "image") {

            const heading = new Paragraph({
                text: `${formattedName}:`,
                heading: HeadingLevel.HEADING_1,
            
            });      
        
            const paragraph2 = new Paragraph({
                text: `${value}`
            });

            paragraphChildren.push(heading, paragraph2);

        } else {
            const imageName = formData[i].fileName;
            // saveFile, intentionally missing blob URL
            blob.saveFile(`https://wpateaserppesablob.blob.core.windows.net/?sp=racwd&st=2022-02-09T22:26:38Z&se=2023-02-10T06:26:38Z&spr=https&sv=2020-08-04&sr=c&sig=FOHK6aEYmFBbiLb4tIh1yzuKOHKR5ZqEZwY9Eyh6YOE%3D`, "testing-forms", `${formInfo.fileTitle}/${imageName}`, Buffer.from(value, "base64")).then(res => {
                //console.log(res)
            });

            const image =    new ImageRun({
                data: Uint8Array.from(atob(value), c =>
                    c.charCodeAt(0)
                ),
                transformation: {
                    width: 200,
                    height: 100
                },
                break: 1
            });

            const heading = new Paragraph({
                text: `${formattedName}:`,
                heading: HeadingLevel.HEADING_1,
            
            }); 

            const textParagraph = new TextRun({
                text: `${imageName}`,
                break: 1
            
            }); 

            const subParagraph =  new Paragraph({
               children:[image, textParagraph]
            
            }); 

            paragraphChildren.push(heading, subParagraph);
        }
    });

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                ...paragraphChildren
            ],
        }],
    });

    Packer.toBuffer(doc).then((buffer) => {
        fs.writeFileSync("My Document.docx", buffer);
        // saveFile - intentionally missing blob url 
        blob.saveFile(`https://wpateaserppesablob.blob.core.windows.net/?sp=racwd&st=2022-02-09T22:26:38Z&se=2023-02-10T06:26:38Z&spr=https&sv=2020-08-04&sr=c&sig=FOHK6aEYmFBbiLb4tIh1yzuKOHKR5ZqEZwY9Eyh6YOE%3D`, "testing-forms", `${formInfo.fileTitle}/${formInfo.fileTitle}.docx`, buffer).then(res => {
            //console.log(res);
        });
    });

    processDataRequest(formData, formInfo).then((res) => {
    }).catch(e=>{console.log(e)});
    res.sendStatus(200);

})

app.get('/', function (req, res) {
    res.redirect('/auth/login');
});

app.get('/form', function (req, res) {
    res.sendFile(path.join(__dirname, "index.html"))
});

app.get('/thankyou', function (req, res) {
    res.sendFile(path.join(__dirname, "thankyou.html"))
});

// Authorization
 app.get('/auth/login', auth.Login.bind(auth));
 app.get('/auth/start', auth.Start.bind(auth));
 app.get('/auth/token', auth.Token.bind(auth));
 app.get('/auth/logout', auth.Logout.bind(auth));

var server = app.listen(8080, function () {
    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)
});

function processMiddlewareRequest(data, fileTitle) {
    return new Promise((req, res, next) => {
        // TODO determine if in prod or dev, for now use dev
        // let dev = 'http://localhost:8080/temp/user-testing/createTest'
        let prod = 'https://viva-insights.azurewebsites.net/temp/user-testing/createTest'
        requestify.post(prod, {
            alias: process.env.USERNAME,
            body: data,
            id: fileTitle
        }).then(function (response) {
            res(response);
            debugger;
        }).catch(e=> {
            console.log(e);

        });
    });
}

function processDataRequest(data, fileInfo) {
    return new Promise((res, rej) => {
        UserTestingQueue.insertUserTest(data, fileInfo).then((response) => {
            res(response);
        }).catch(e => {
            console.log("**", e)
            rej(e);
        });
    });
}

function formatName(name){
    return name.charAt(0).toUpperCase() + name.slice(1);
}

function parseHeaders(headers) {
    var parsed = {};
    var regex = /\\u([\d\w]{4})/gi;

    headers = headers.replace(regex, function (match, grp) {
        return String.fromCharCode(parseInt(grp, 16));
    });
    headers = unescape(headers);
    headers.split(';').map(item => {
        let split = item.split('=');
        parsed[split[0].trim()] = split[1].trim();
    });

    return parsed;
}