'use strict';

/* Socket.io 초기화 */
const express = require('express');
const socketIO = require('socket.io');
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

/* 웹서버 등록 */
const server = express()
    .use((req, res) => res.sendFile(INDEX))
    .listen(PORT, () => console.log(`Listening on ${PORT}`));

/* 웹서버에 socket.io */
const io = socketIO(server);

/* A: 웹페이지 접속했을때 뒤 함수 호출 */
io.on('connection', (socket) => {
    console.log('Client connected');
    socket.emit('connection', "Connected.");

    /* D: 웹페이지 접속 이후 메시지를 받을때 뒤 함수 호출 */
    socket.on('message', function (data) {
        /* 서버 콘솔에 메시지 로그 */
        console.log("메시지가 도착했습니다. : " + data);

        /* E: 받은 메시지를 다시 클라이언트에 전송 */
        socket.emit('newMessage', data);
    })

    /* 웹페이지를 닫았을때 뒤 함수 호출*/
    socket.on('disconnect', () => console.log('Client disconnected'));
});