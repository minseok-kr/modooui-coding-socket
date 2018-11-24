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
                console.log("기존 키 사용")
                one = docs[0];

                callback({ status: "success", "code": one.code, expire: one.expire })
            } else {
                console.log("새로운 키 생성")
                let code = uuid().split('-')[1];
                callback({ status: "success", code: code, expire: "" })
            }
        });

        // TODO: 메소드 상단에 database 닫혀있을시 다시 연결하는 로직 추가.
        // database.close();
    });
}