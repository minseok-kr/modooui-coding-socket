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

exports.generateInviteCode = function (database, roomNumber, callback) {
    database.connect(function (err) {
        if (err != null) {
            callback({ status: "fail", code: "" });
        }

        const db = database.db("room");
        db.collection('invite').find({ "room": roomNumber }).toArray(function (err, docs) {
            // TODO: find -> findOne
            if (docs.length != 0) {
                one = docs[0];

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