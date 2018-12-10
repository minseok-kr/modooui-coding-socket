/**
 * Room database.
 * 
 * 방 번호, 초대코드, 만료기간.
 * { roomNum: 0, code: "LNLN", expire: "2018-11-23 13:00:00" }
 * 
 */

/**
 * RoomCode 생성. (초대 링크용.)
 */

const uuid = require('uuid-v4');

/**
 * 초대 링크가 유효한지 확인하고. 유효하면 해당 회원을 등록한다.
 */
exports.validateInvitation = function(mongodb, inviteCode, userId, callback) {
    
    mongodb.connect(function (err) {
        if (err != null) return
        const db = mongodb.db('modoocoding');
        db.collection('invite').findOne({ code: inviteCode }, function (err, data) {
            if (err != null) {
                callback({status: 500, msg: err})
                return;
            }

            if (data != null) {
                let curTime = new Date().getTime();
                if (curTime < data.expire) {
                    console.log('초대 링크 성공');

                    db.collection('room').findOne({ index: Number(data.room) }, function (err, roomData) {
                        if (err != null) {
                            callback({status: 500, msg: err});
                            return;
                        }


                        // 해당 아이디를 스터디 참여자로 등록.
                        let targetUsers = roomData.users;
                        let findResult = targetUsers.find(function(user) {
                            return user == userId;
                        });

                        if (findResult == undefined ) {
                            targetUsers.push(userId);
                            db.collection('room').update({ index: Number(data.room) }, { $set: { users: targetUsers } })
                        }

                        // 스터디룸 이동을 위한 데이터 제공.                        
                        if (roomData != null) {
                            let targetData = { "room": Number(data.room), "name": roomData.title, "desc": roomData.description };
                            callback({status: 200, data: targetData})
                        } else {
                            callback({status: 500})
                        }
                    })

                } else {
                    console.log('초대 링크 실패: ' + ((curTime - data.expire) / 1000) + "초 경과");
                    callback({status: 406, msg: "초대 링크가 만료되었습니다.\n 초대 링크를 다시 요청하세요"})
                }
            } else {
                callback({status: 500})
            }
        })
    })
}

exports.generateInviteCode = function (database, roomNumber, callback) {
    database.connect(function (err) {
        if (err != null) {
            callback({ status: "fail", code: "" });
        }

        const db = database.db("modoocoding");
        db.collection('invite').findOne({ "room": roomNumber }, function (err, one) {
            if (one != null) {

                if (isTimeNotValid(one.expire)) {
                    db.collection('invite').deleteMany({"room": roomNumber})

                    console.log("[" + roomNumber + "] 기존 키 사용하려 했으나, 키가 만료되었음.")
                    generateNewKey(db, roomNumber, callback);
                    return;
                }

                console.log("[" + roomNumber + "] 기존 키 사용")
                callback({ status: "success", "code": one.code, expire: one.expire })
            } else {
                console.log("[" + roomNumber + "] 새로운 키 생성")
                generateNewKey(db, roomNumber, callback);
            }
        });

        // TODO: 메소드 상단에 database 닫혀있을시 다시 연결하는 로직 추가.
        // database.close();
    });
}

function isTimeNotValid(targetTime) {
    let curTime = new Date().getTime();
    
    return curTime > targetTime;
}

function generateNewKey(db, room, callback) {
    // const LIMIT_MIN = 60 * 1000;     // 1 MINS
    const LIMIT_MIN = 5 * 60 * 1000;     // 5 MINS
    
    let code = uuid().split('-')[1];
    let expireDate = new Date().getTime() + LIMIT_MIN;
    
    let data = {"room": room, "code": code, "expire": expireDate};
    db.collection('invite').insertOne(data);

    callback({ status: "success", code: code, expire: expireDate });
}