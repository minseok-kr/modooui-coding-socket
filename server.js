'use strict';

/* Socket.io 초기화 */
const express = require('express');
const path = require('path');
const mongodb = require('mongodb').MongoClient('mongodb://localhost:27017', { useNewUrlParser: true });
const app = express();
const server = require('http').createServer(app);
const port = process.env.PORT || 3000;
const bodyParser = require('body-parser');
const expressSession = require('express-session');
const socketIO = require('socket.io');
const io = socketIO(server);

/* Custom Modules */
const eventer = require('./module/eventer.js');
const codeChecker = require('./module/checker.js');
const invitator = require('./module/invitator.js');
const auth = require('./module/authenticator.js');

eventer.onEvent(io);

app.use(express.static(path.join(__dirname, 'site')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// EJS Setting
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

server.listen(port, () => console.log('>>> http://localhost:' + port));

/**
*   Routing.
*/
let siteurl = __dirname + "/site/"

// Session.
app.use(expressSession({
    secret: 'modoo-session-key',
    resave: true,
    saveUninitialized: true
}));

app.get('/client?:code', function (req, res) {
    if (!auth.isLogin(req, res)) return;

    let roomNumber = 0;
    for (let key in req.query) { roomNumber = key; }

    let clientId = req.session.user.userId;
    let userName = req.session.user.userName;
    let userImg = req.session.user.userImg;
    console.log("[" + clientId + "] joins room " + roomNumber + ".");

    connectRoom(clientId, roomNumber, function () {

        console.log("IO : " + io);

        res.render("coderoom-client", {
            roomNumber: roomNumber,
            userId: clientId,
            userName: userName,
            userImg: userImg
        });
    })
})

app.get('/manage?:code', function (req, res) {
    if (!auth.isLogin(req, res)) return;

    let roomNumber = 0;
    for (let key in req.query) { roomNumber = key; }

    let clientId = req.session.user.userId;
    let userName = req.session.user.userName;
    let userImg = req.session.user.userImg;

    connectRoom(clientId, roomNumber, function () {
        res.render("coderoom-partner", {
            roomNumber: roomNumber,
            userId: clientId,
            userName: userName,
            userImg: userImg
        });
    })
})

function connectRoom(clientId, roomNumber, successCallback) {
    mongodb.connect(function (err) {
        if (err) {
            res.redirect('/');
            return;
        }

        const db = mongodb.db('modoocoding');
        db.collection('room').findOne({ "index": Number(roomNumber) }, function (err, data) {
            if (err != null) {
                console.log(err);
                return;
            }

            if (data != null) {
                // console.log(data);
                if (data.users.find(function (e) {
                    return e == clientId;
                }) == undefined && data.owner != clientId) {
                    console.log("권한없음")
                    res.redirect('/');
                    return;
                }

                // socket 연결
                successCallback()
                return;
            }
            res.redirect('/');
        })
    })
}


app.get('/login', function (req, res) {
    if (!auth.isLogin(req, res)) return;

    // 이미 되어있음.
    res.redirect('/');
})

app.get('/signin', function (req, res) {
    if (auth.checkLogin(req)) {
        res.redirect('/');
        return;
    }

    res.render("login", {})
    res.end();
})

app.get('/newchannel', function (req, res) {
    let userId = "";
    let userName = "";
    let userImg = "";

    if (auth.checkLogin(req)) {
        userId = req.session.user.userId;
        userName = req.session.user.userName;
        userImg = req.session.user.userImg;
    }

    res.render("choiceroom", {
        userId: userId,
        userName: userName,
        userImg: userImg
    });
})

app.get('/problems', function (req, res) {
    let userId = "";
    let userName = "";
    let userImg = "";

    if (auth.checkLogin(req)) {
        userId = req.session.user.userId;
        userName = req.session.user.userName;
        userImg = req.session.user.userImg;
    }

    res.render("problems", {
        userId: userId,
        userName: userName,
        userImg: userImg
    });
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
    if (!auth.isLogin(req, res)) {
        res.sendStatus(404);
        return;
    };

    let id = req.session.user.userId;
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
            let newRoom = { "index": maxRoomIndex, "title": reqData.name, "description": reqData.desc, "owner": id, "users": [""], "problem": problem }

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
app.post('/api/room/getInfo', function (req, res) {
    // TODO: 정보 얻을 자격 있는지 Validate!

    let roomNumber = req.body.code;
    let userType = req.body.type;
    let clientId = req.session.user.userId;
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

            if (userType == "client") {
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
            } else {
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
            }

            
            res.sendStatus(400);
        })
    })
})

app.get('/channel/new', function (req, res) {
    if (!auth.isLogin(req, res)) { return; }

    let userId = req.session.user.userId;
    let userName = req.session.user.userName;
    let userImg = req.session.user.userImg;

    res.render("makeroom", {
        userId: userId,
        userName: userName,
        userImg: userImg
    })
})

app.get('/channel/', function (req, res) {
    let userId = "";
    let userName = "";
    let userEmail = "";
    let userImg = "";

    if (auth.checkLogin(req)) {
        userId = req.session.user.userId;
        userName = req.session.user.userName;
        userEmail = req.session.user.userEmail;
        userImg = req.session.user.userImg;
    }

    res.render("choiceroom", {
        userId: userId,
        userName: userName,
        userEmail: userEmail,
        userImg: userImg,
    });
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

// 방 정보에 사용자 등록.
app.post('/api/invite/join', function (req, res) {
    // 방 Users에 참여자 추가.
    // 방으로 이동
})

app.get('/v/:code', function (req, res) {
    let userId = "";
    let userName = "";
    let userEmail = "";
    let userImg = "";

    if (auth.checkLogin(req)) {
        userId = req.session.user.userId;
        userName = req.session.user.userName;
        userEmail = req.session.user.userEmail;
        userImg = req.session.user.userImg;
    }

    let roomName = "";
    let roomDesc = "";
    let roomNum = 0;

    let code = req.params.code;
    console.log(code);
    invitator.validateInvitation(mongodb, code, userId, function (result) {
        if (result.status == 200) {
            let data = result.data;
            roomNum = data.room;
            roomName = data.name;
            roomDesc = data.desc;

            res.render("invite", {
                userId: userId,
                userName: userName,
                userEmail: userEmail,
                userImg: userImg,
                roomNum: roomNum,
                roomName: roomName,
                roomDesc: roomDesc
            });

            return;
        }

        let err_msg = "";
        if (result.status == 406) {
            err_msg = result.msg;
        }

        res.render("invite-error", {
            userId: userId,
            userName: userName,
            userImg: userImg,
            err: err_msg
        });
    })
})

app.get('/profile', function (req, res) {
    if (!auth.isLogin(req, res)) return;

    let userId = req.session.user.userId;
    let userName = req.session.user.userName;
    let userImg = req.session.user.userImg;
    let userEmail = req.session.user.userEmail;

    res.render("profile", {
        userName: userName,
        userId: userId,
        userImg: userImg,
        userEmail: userEmail
    })
    res.end();
})

app.get('/api/profile', function (req, res) {
    if (!req.session.user) {
        console.log("찾을 수 없음.")
        res.sendStatus(404);
        return;
    }
    console.log(req.session.user);

    let id = req.session.user.userId;
    let name = req.session.user.userName;
    let img = req.session.user.userImg;
    let email = req.session.user.userEmail;

    mongodb.connect(function (err) {
        let db = mongodb.db('modoocoding');

        db.collection('room').find({
            $or:
                [{ "users": { $in: [id] } },
                { "owner": id }]
        }).toArray(function (err, docs) {
            if (err) {
                console.log(err);
                res.sendStatus(500);
                return;
            }

            let response = {
                "userName": name,
                "userImg": img,
                "userEmail": email,
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


app.post('/api/_login', function (req, res) {
    console.log('Try Login');

    let paramId = req.body.userId || req.query.userId;
    let paramName = req.body.userName || req.query.userName;
    let paramImg = req.body.userImg || req.query.userImg;
    let paramEmail = req.body.userEmail || req.query.userEmail;

    if (req.session.user) {
        console.log("이미 로그인 되어있음.")

        res.sendStatus(403)
    } else {
        console.lo
        // 로그인
        req.session.user = {
            userId: paramId,
            userName: paramName,
            userImg: paramImg,
            userEmail: paramEmail,
            authorized: true
        }

        res.sendStatus(200)
    }
})

app.get('/api/_logout', function (req, res) {
    console.log('Try Logout');

    if (req.session.user) {
        console.log("로그아웃 시도")

        req.session.destroy(function (err) {
            if (err) throw err;

            console.log("로그아웃 완료");
            res.redirect('/');
        })
    } else {
        console.log("로그아웃 되어있지 않음.")

        res.redirect('/')
    }
})

app.get('/', function (req, res) {
    res.render("index", {})
})

app.get('*', function (req, res) {
    let userId = "";
    let userName = "";
    let userEmail = "";
    let userImg = "";

    if (auth.checkLogin(req)) {
        userId = req.session.user.userId;
        userName = req.session.user.userName;
        userEmail = req.session.user.userEmail;
        userImg = req.session.user.userImg;
    }

    res.render("error-404", {
        userName: userName,
        userId: userId,
        userImg: userImg,
        userEmail: userEmail
    })
})
//app.use(express.static(path.join(__dirname, 'css/styles.css')));
