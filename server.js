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

// 방 입장시 초기화.
app.post('/room/getInfo', function (req, res) {
    let roomNumber = req.body.code;
    console.log("ROOM: " + roomNumber);

    mongodb.connect(function (err) {
        if (err) {
            res.sendStatus(400);
            return;
        }

        const db = mongodb.db('modoocoding');
        db.collection('room').findOne({ "index": Number(roomNumber) }, function (err, data) {
            if (err != null) {
                console.log(err);
                return;
            }

            if (data != null) {
                console.log(data);
                res.json(data);
                return;
            }
            res.sendStatus(400);
        })
    })
})

app.get('/channel/new', function (req, res) {
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

app.post('/api/invite/check', function (req, res) {
    let inviteCode = req.body.code;

    mongodb.connect(function (err) {
        if (err != null) return
        const db = mongodb.db('modoocoding');
        db.collection('invite').findOne({ code: inviteCode }, function (err, data) {
            if (err != null) {
                console.log(err)
                res.sendStatus(500);
                return;
            }

            if (data != null) {
                console.log(data);

                let curTime = new Date().getTime();
                if (curTime < data.expire) {
                    console.log('초대 링크 성공');

                    // 초대 받았다는 세션 추가: 이는 미들웨어에서 검사 예정.
                    // res.redirect('/invite/' + inviteCode);
                    db.collection('room').findOne({ "index": data.room }, function (err, roomData) {
                        if (err != null) {
                            console.log(err)
                            res.sendStatus(500);
                            return;
                        }

                        if (data != null) {
                            console.log(roomData)
                            res.json({ "name": roomData.title, "desc": roomData.description });
                        } else {
                            res.sendStatus(500);
                        }
                    })

                } else {
                    console.log('초대 링크 실패: ' + ((curTime - data.expire) / 1000) + "초 경과");
                    res.sendStatus(500);
                }
            } else {
                res.sendStatus(500);
            }
        })
    })
})

// 방 정보에 사용자 등록.
app.post('/api/invite/join', function (req, res) {
    // 방 Users에 참여자 추가.
    // 방으로 이동
})

app.get('/v/:code', function (req, res) {
    res.sendFile(siteurl + 'invite/');
})

app.get('/invite/', function (req, res) {
    console.log("[2]?????");
    res.redirect('/invite/error.html');
})

app.get('*', function (req, res) {
    res.redirect('/error-404.html');
})
//app.use(express.static(path.join(__dirname, 'css/styles.css')));
