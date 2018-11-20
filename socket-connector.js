const socketIO = require('socket.io');

exports.initSocket = function(server) {
    const io = socketIO(server);
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
    *   도움 요청
    */
        socket.on('submit', (data) => {
            console.log("Somebody submits!")

            socket.broadcast.emit('somebodySubmit', data)
        });

        /* 웹페이지를 닫았을때 뒤 함수 호출*/
        socket.on('disconnect', () => console.log('Client disconnected'));
    });    
}

