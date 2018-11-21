'use strict';

/* Socket.io 초기화 */
const fs = require('fs');

const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const sokectConnector = require('./socket-connector.js');

const bodyParser = require('body-parser');

const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'site')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

server.listen(port, () => console.log('>>> http://localhost:' + port));

/**
*   Socket Connector.
*   Socket과 관련된 모든 행동을 수행 함.
*/
sokectConnector.initSocket(server);   

var name = "";

/* URL */

let siteurl = __dirname + "/site/" 

app.get('/client', function(req, res) {
    res.sendFile(siteurl + 'chat/client-index.html');
})

app.get('/manage', function(req, res) {
    res.sendFile(siteurl + 'chat/manager-index.html');
})


app.get('/login', function(req, res) {
    res.sendFile(siteurl + 'singin/index.html');
})

app.get('/newchannel', function(req, res) {
    res.sendFile(siteurl + 'channel/index.html');
})

app.get('/problems', function(req, res) {
    res.sendFile(siteurl + 'problems/index.html');
})

var exec = require('child_process').exec, child;

app.post('/checkcode', function(req,res) {
    console.log("someone try to compile code.")
    console.log(req.body);
    let code = req.body.code;
    let filename = "text.py"

    let encoded = "#-*-coding:utf-8\n"

    // 파일 만들고.
    fs.writeFile("tmp/" + filename, encoded + code, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("File was saved.")

        // 컴파일.
        let opts = {
            encoding: 'utf8',
            timeout: 2000,
            maxBuffer: 10*1024,
            killSignal: 'SIGTERM',
            cwd: null,
            env: null
        }

        child = exec("python tmp/" + filename, opts, function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log("exec error: " + error);
            }

            let status = ""
            if (error == null) {
                status = "빌드 성공"    
            } else {
                status = "빌드 실패"
            }

            res.json({ status: status, stdout: stdout, stderr: stderr, error: error });
        })
    })
})

//app.use(express.static(path.join(__dirname, 'css/styles.css')));
