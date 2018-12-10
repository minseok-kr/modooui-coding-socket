/**
*   사용자에게 알림을 담당하는 모듈
*/
exports.onEvent = function (io) {
    io.on('connection', (socket) => {
        console.log('Client connected');
        socket.emit('connection', "Connected.");

        socket.on('join', function (data) {
            console.log("Join: " + data.room);
            let userName = data.userName;
            let room = data.room;
            let userImg = data.photo;
            let userId = data.clientId;

            // 같은 방 조인.
            socket.join(room);
            socket.to(room).emit('alertChangeUserState', {
                state: "join",
                room: room,
                userName: userName,
                userImg: userImg,
                userId: userId
            })

            if (data.type == "partner") {
                socket.to(room).emit("handshake", {
                    "roomNumber": room,
                    "name": userName,
                    "clientId": userId,
                    "userImg": userImg
                });
            }
        });

        socket.on('code', function (data) {
            socket.to(data.roomNumber).emit('codeUpdate', data);
        });

        /**
        *   도움 요청
        */
        socket.on('help', (data) => {
            console.log("Somebody wants help!")
            socket.broadcast.emit('somebodyHelp', data)
        });

        /**
        *   제출 요청
        */
        socket.on('submit', (data) => {
            console.log("Somebody submits!")

            socket.broadcast.emit('somebodySubmit', data)
        });

        /**
         *  접속 중임을 알림.
         */
        socket.on('handshake', (data) => {
            console.log("ReceiveHandShake");
            socket.to(data.roomNumber).emit("handshakeRes", data);
        })

        /**
         *  정답 제출 알림
         */
        socket.on('submitAnswer', (data) => {
            console.log("Submit but Awnser is " + data);

            socket.broadcast.emit('submitResult', data);
        });

        /**
         *  채팅 관련
         */
        socket.on('sendMessage', (data) => {
            let room = data.room;
            let userName = data.userName;
            let userImg = data.userImage;
            let message = data.message;

            console.log("[" + room + "] " + userName + ": " + message);

            socket.to(room).emit('receivedMessage', {
                room: room,
                name: userName,
                img: userImg,
                text: message
            })
        })

        // socket.on('onChangeUserState', (data) => {
        //     let room = data.room;
        //     let userName = data.userName;
        //     let userImg = data.userImage;
        //     let state = data.state;

        //     socket.to(room).emit('alertChangeUserState', {
        //         room: room,
        //         name: userName,
        //         img: userImg,
        //         state: state
        //     })
        // })

        /* 웹페이지를 닫았을때 뒤 함수 호출*/
        socket.on('disconnect', () => {
        });
    })
}
