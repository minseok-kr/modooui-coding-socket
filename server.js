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
            let newRoom = { "index": maxRoomIndex, "title": reqData.name, "description": reqData.desc, "owner": "id", "users": [""], "problem": problem }

            db.collection('room').insertOne(newRoom);
            res.redirect("/room/" + maxRoomIndex);
        })
    })
})

// 방 입장
app.get('/room/:code', function (req, res) {
    let roomNumber = req.params.code;
    res.redirect('/manage?' + roomNumber);
})

// 방 입장시 초기화.
app.post('/room/getInfo', function (req, res) {
    // TODO: 정보 얻을 자격 있는지 Validate!

    let roomNumber = req.body.code;
    let clientId = req.body.clientId;
    console.log("[" + clientId + "] joins room " + roomNumber + ".");

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
                if (data.users.find(function (e) {
                    return e == clientId;
                }) == undefined && data.owner != clientId) {
                    console.log("권한없음")
                    res.sendStatus(401);
                    return;
                }

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
app.post('/api/invite/generate', function (req, res) {
    let roomNumber = req.body.room;

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
                let curTime = new Date().getTime();
                if (curTime < data.expire) {
                    console.log('초대 링크 성공');

                    console.log(data);
                    db.collection('room').findOne({ "index": Number(data.room) }, function (err, roomData) {
                        if (err != null) {
                            console.log(err)
                            res.sendStatus(500);
                            return;
                        }

                        console.log(roomData);
                        if (roomData != null) {
                            res.json({ "room":  Number(data.room), "name": roomData.title, "desc": roomData.description });
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
    res.redirect('/invite/error.html');
})

app.post('/api/profile', function (req, res) {
    let id = req.body.clientId;
    mongodb.connect(function (err) {
        let db = mongodb.db('modoocoding');

        db.collection('room').find({
            $or:
                [{ "users": { $in: ['id'] } },
                { "owner": "id" }]
        }).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
                return;
            }

            let response = {
                "host": [],
                "member": []
            }
            for (let i = 0; i < docs.length; i++) {
                if (docs[i].owner == id) {
                    response["host"].push(docs[i]);
                } else {
                    response["member"].push(docs[i]);
                }
            }

            res.json(response);
        })
    })

    // {
    //     _id: 5bfc30ae2834bd04034ffddc,
    //         index: 2,
    //             title: '나는 슬플때 스터디를 연다',
    //                 description: '나 혼자 하는 스터디',
    //                     owner: '',
    //                         users: ['id'],
    //                             problem: { descript: '2를 출력해보자', input: '', output: '2' }
    // }
})

app.get('*', function (req, res) {
    res.redirect('/error-404.html');
})
//app.use(express.static(path.join(__dirname, 'css/styles.css')));
