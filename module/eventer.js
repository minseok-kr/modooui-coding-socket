/**
*   사용자에게 알림을 담당하는 모듈
*/

exports.onEvent = function(io) {
    io.on('connection', (socket) => {
        console.log('Client connected');
        socket.emit('connection', "Connected.");

        socket.on('code', function(data) {
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
        
        
        socket.on('submitAnswer', (data) => {
            console.log("Submit but Awnser is " + data);
            
            socket.broadcast.emit('submitResult', data);
        });

        /* 웹페이지를 닫았을때 뒤 함수 호출*/
        socket.on('disconnect', () => console.log('Client disconnected'));
    })
}
