'use strict';

/* Socket.io 초기화 */
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const sokectConnector = require('./socket-connector.js');


const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'site')));

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


//app.use(express.static(path.join(__dirname, 'css/styles.css')));
