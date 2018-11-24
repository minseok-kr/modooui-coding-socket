'use strict';

/* Socket.io 초기화 */
const express = require('express');
const path = require('path');
const mongodb = require('mongodb').MongoClient('mongodb://localhost:27017');
const socketIO = require('socket.io');
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


app.get('/api/invite/generate', function(req, res) {
    let roomNumber = req.params.room;

    // TODO: Test
    roomNumber = 1;

    invitator.generateInviteCode(mongodb, roomNumber, function(invitation) {
        console.log(invitation);

        if (invitation.code == -9) {
            console.log(Date() + ": Room " + roomNumber + ". already has iviteCode " +  + invitation.code);
    
            res.json(invitation)
        } else {
            console.log(Date() + ": Generate Invite Code." + invitation.code);
    
            res.json(invitation)
        }
    })
})

app.get('/v/:code', function(req, res) {
    console.log(req.url)
    let inviteCode = req.params.code

    console.log("======")
    console.log(req.url);
    console.log(req.params.code);
    console.log("======")
    if (inviteCode == 'undefinded') {
        res.redirect('/invite/error.html');
        return
    }

    res.redirect('/invite/?' + inviteCode);
})

app.get('/v', function(req, res) {
    res.redirect('/invite/error.html');
})



app.get('', function(req, res) {
    console.log(req.params.code);
})
//app.use(express.static(path.join(__dirname, 'css/styles.css')));
