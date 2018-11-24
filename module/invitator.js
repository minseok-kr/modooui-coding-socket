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

exports.generateInviteCode = function() {
    let uuid_key = uuid();
    let uuid_set = uuid_key.split('-');
    
    return uuid_set[1];
}

