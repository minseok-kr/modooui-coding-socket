'use strict';

/* Socket.io 초기화 */
const express = require('express');
const path = require('path');
const mongodb = require('mongodb').MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
const socketIO = require('socket.io');
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const io = socketIO(server);
const bodyParser = require('body-parser');

/* Custom Modules */
const eventer = require('./module/eventer.js');
const codeChecker = require('./module/checker.js');
const invitator = require('./module/invitator.js');

app.use(express.static(path.join(__dirname, 'site')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

server.listen(port, () => console.log('>>> http://localhost:' + port));

eventer.onEvent(io);

/**
*   Routing.
*/
let siteurl = __dirname + "/site/"

app.get('/client', function (req, res) {
    res.sendFile(siteurl + 'chat/client-index.html');
})

app.get('/manage', function (req, res) {
    res.sendFile(siteurl + 'chat/manager-index.html');
})


app.get('/login', function (req, res) {
    res.sendFile(siteurl + 'singin/index.html');
})

app.get('/newchannel', function (req, res) {
    res.sendFile(siteurl + 'channel/index.html');
})

app.get('/problems', function (req, res) {
    res.sendFile(siteurl + 'problems/index.html');
})

/**
*   메인 기능.
*/
app.post('/api/build', function (req, res) {
    console.log("someone try to compile code.")
    console.log(req.body);
    let code = req.body.code;
    let filename = "text.py"

    // Response with Callback
    codeChecker.buildCode("", filename, code, function (data) {
        res.json(data);
    });
})

app.post('/api/confirmCode', function (req, res) {
    //    let roomNum = req.body.room;

    let code = req.body.code;
    let filename = "text.py"

    codeChecker.buildCode("", filename, code, function (data) {
        //        { status: status, stdout: stdout, stderr: stderr, error: error }

        if (data.status != "success") {
            res.json(data)
        } else {
            // 주최자에게 Socket 신호 보내기.
            //            notifier.re
        }
    })
})

/**
 * 방 관련
 */

// 방 생성
app.post('/api/room/generate', function (req, res) {
    mongodb.connect(function (err) {
        if (err != null) return

        const db = mongodb.db("modoocoding");
        db.collection('room').find().count(function (err, num) {
            if (err != null) {
                res.redirect("/");
                return;
            }

            let reqData = req.body;

            let maxRoomIndex = num;
            // 방에 설정될 기본 문제.
            let problem = { "descript": reqData.problemDesc, "input": reqData.problemIn, "output": reqData.problemOut }
            let newRoom = { "index": maxRoomIndex, "title": reqData.name, "description": reqData.desc, "onwer": "", "users": [""], "problem": problem }

            db.collection('room').insertOne(newRoom);
            res.redirect("/room/" + maxRoomIndex);
        })
    })
})

// 방 입장
app.get('/room/:code', function (req, res) {
    let roomNumber = req.params.code;
    // res.redirect('/client?' + roomNumber);
    res.redirect('/manage?' + roomNumber);
})

app.get('/channel/new', function(req, res) {
    res.sendFile(siteurl + '/channel/new-channel.html')
})


/**
 * 초대 관련 Route 
 */
app.get('/api/invite/generate', function (req, res) {
    let roomNumber = req.params.room;

    // TODO: Test
    roomNumber = 1;

    invitator.generateInviteCode(mongodb, roomNumber, function (invitation) {
        res.json(invitation)
    })
})

app.get('/v/:code', function (req, res) {
    console.log(req.url)
    let inviteCode = req.params.code
    if (inviteCode == 'undefinded') {
        res.redirect('/invite/error.html');
        return
    }

    res.redirect('/invite/?' + inviteCode);
})

app.get('/v', function (req, res) {
    res.redirect('/invite/error.html');
})



app.get('', function (req, res) {
    console.log(req.params.code);
})
//app.use(express.static(path.join(__dirname, 'css/styles.css')));
