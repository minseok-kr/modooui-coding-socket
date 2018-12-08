/**
*   사용자에게 알림을 담당하는 모듈
*/
exports.onEvent = function (io) {
    console.log("OnEvent")
    io.on('connection', (socket) => {
        console.log('Client connected');
        socket.emit('connection', "Connected.");

        socket.on('join', function (data) {
            console.log("Join: " + data.room);
            let userNmae = data.userName;
            let room = data.room;

            // 같은 방 조인.
            socket.join(room);
            socket.broadcast.emit('alertChangeUserState', {
                room: room,
                name: userNmae
            })
        });

        socket.on('code', function (data) {
            //        console.log("CodeUpdate!: " + data);

            /* TODO */
            // socket.of(roomnum).emit 형태로 변경
            socket.broadcast.emit('codeUpdate', data);
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
