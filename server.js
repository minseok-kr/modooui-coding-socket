'use strict';

/* Socket.io 초기화 */
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const socketIO = require('socket.io');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const io = socketIO(server);
const bodyParser = require('body-parser');

/* Custom Modules */
const eventer = require('./module/eventer.js');
const codeChecker = require('./module/checker.js');

app.use(express.static(path.join(__dirname, 'site')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

server.listen(port, () => console.log('>>> http://localhost:' + port));

eventer.onEvent(io);

/**
*   Routing.
*/
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

/**
*   메인 기능.
*/
app.post('/build', function(req,res) {
    console.log("someone try to compile code.")
    console.log(req.body);
    let code = req.body.code;
    let filename = "text.py"

    // Response with Callback
    codeChecker.buildCode("", filename, code, function(data) {
        res.json(data);
    });
})

app.post('/confirmCode', function(req, res) {
    //    let roomNum = req.body.room;

    let code = req.body.code;
    let filename = "text.py"

    codeChecker.buildCode("", filename, code, function(data) {
        //        { status: status, stdout: stdout, stderr: stderr, error: error }

        if (data.status !=  "success") {
            res.json(data)
        } else {
            // 주최자에게 Socket 신호 보내기.
            //            notifier.re
        }
    })
})
//app.use(express.static(path.join(__dirname, 'css/styles.css')));
