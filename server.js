'use strict';

/* Socket.io 초기화 */
const express = require('express');
const path = require('path');
const MongoClient = require('mongodb').MongoClient;
const sokectConnector = require('./socket-connector.js');


const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '.')));

server.listen(port, () => console.log('>>> http://localhost:' + port));

/**
*   Socket Connector.
*   Socket과 관련된 모든 행동을 수행 함.
*/
sokectConnector.initSocket(server);   

var name = "";

/* URL */
app.get('/client', function(req, res) {
    res.sendFile(__dirname + '/chat/client-index.html');
})

app.get('/manage', function(req, res) {
    res.sendFile(__dirname + '/chat/manager-index.html');
})


app.get('/login', function(req, res) {
    res.sendFile(__dirname + '/singin/index.html');
})

app.get('/newchannel', function(req, res) {
    res.sendFile(__dirname + '/channel/index.html');
})

app.get('/problems', function(req, res) {
    res.sendFile(__dirname + '/problems/index.html');
})


//app.use(express.static(path.join(__dirname, 'css/styles.css')));
