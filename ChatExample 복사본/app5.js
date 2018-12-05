var express=require('express');
var http=require('http');
var static=require('serve-static');
var path=require('path');

var bodyParser=require('body-parser');
var cookieParser=require('cookie-parser');
var expressSession=require('express-session');

// 에러 핸들러 모듈 사용
var expressErrorHandler=require('express-error-handler');

var user=require('./routes/user');

var config=require('./config/config');

//var database_loader=require('./database/database_loader');
var route_loader =require('./routes/route_loader');

//암호화 모듈
var crypto=require('crypto');

//socket.io사용
var socketio=require('socket.io');
var cors=require('cors');


//passport사용
var passport=require('passport');
var flash=require('connect-flash');

var app=express();

app.set('view', __dirname + '/views');
app.set('view engine', 'ejs');
//app.set('view engine', 'pug');

console.log('config.server_port ->' +config.server_port);
app.set('port', config.server_port || 3000);

app.use('/public', static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

app.use(cookieParser());
app.use(expressSession({
    secret:'my key',
    resave:true,
    saveUninitialized:true
}));

//cors초기화
app.use(cors());

//passport 초기화
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

var configPassport=require('./config/passport');
configPassport(app.passport);

var router=express.Router();
route_loader.init(app, router);

var userPassport=require('./routes/user_passport');
userPassport(router, passport);


//404 에러 페이지 처리
var errorHandler=expressErrorHandler({
    static: {
        '404':'./public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

var server=http.createServer(app).listen(app.get('port'), function(){
    console.log('익스프레스로 웹 서버를 실행함 : ' + app.get('port'));
    
    //database_loader.init(app, config);
});

//socket.io 서버 시작
var io=socketio.listen(server);
console.log('socket.io 요청을 받아들일 준비가 되었습니다.');

var login_ids={};

io.sockets.on('connection', function(socket){
    console.log('connection info ->' + socket.request.connection._peername);
    
    socket.remoteAddress=socket.request.connection._peername.address;
    socket.remotePort=socket.request.connection._peername.port;
    
    socket.on('login', function(input){
        console.log('login 받음->'+JSON.stringify(input));
        
        login_ids[input.id]=socket.id;
        socket.login_id=input.id;
        
        sendResponse(socket, 'login', 200, 'ok');
    });
    
    socket.on('message', function(message){
        console.log('message 받음->'+JSON.stringify(message));
        //받아서 전송
        if(message.recepient == 'ALL'){
            console.log('모든 클라이언트에게 메시지 전송함.');
            
            io.sockets.emit('message', message);
            
            
        }
        else{    
            if(message.command=='chat'){
                if(login_ids[message.recepient]){
                    
                io.sockets.connected[login_ids[message.recepient]].emit('message', message);
                
                sendResponse(socket, 'message', 200, 'ok');
            }
            else{
                sendResponse(socket, 'message', 400, '수신자 ID를 찾을 수 없습니다.');
            }
                
            }
            else if (message.command='groupchat'){
                io.sockets.in(message.recepient).emit('message', message);
                
                sendResponse(socket, 'message', 200, 'ok');
                
            }
    
        }        
    });
    
    socket.on('room', function(input) {
        console.log('room 받음 ->'+ JSON.stringify(input));
        
        if(input.command =='create'){
            if(io.sockets.adapter.rooms[input.roomId]){
               console.log('이미 방이 만들어져 있습니다');
            }
            else{
                console.log('새로 방을 만듭니다');
                socket.join(input.roomId);
                var curRoom=io.sockets.adapter.rooms[input.roomId];
                curRoom.id=input.roomId;
                curRoom.name=input.roomName;
                curRoom.owner=input.roomOwner;
                
            }
            sendRoomList();
            
            
        }
        else if (input.command=='update'){
            var curRoom=io.sockets.adapter.rooms[input.roomId];
            curRoom.id=input.roomId;
            curRoom.name=input.roomName;
            curRoom.owner=input.roomOwner;
            
            sendRoomList();
            
        }
        else if (input.command=='delete'){
            socket.leave(input.roomId);
            
            if(io.sockets.adapter.rooms[input.roomId]){
                delete io.sockets.adapter.rooms[input.roomId];
                
            }
            else{
                console.log('방이 만들어져 있지 않습니다');
            }
            sendRoomList();
        }
        else if(input.command='join'){
            socket.join(input.roomId);
            
            sendResponse(socket, 'room', 200, 'ok');
        }
        else if(input.command='leave'){
            socket.leave(input.roomId);
            
            sendResponse(socket, 'room', 200, 'ok');
            
        }
        
        
        
        /*
        var roomList=getRoomList();
        var output={
            command:'list',
            rooms:rooms
        };
        */
        
              
    });
});
/*
function sendRoomList(){
    var rooms=getRoomList();
    var output={
        command:'list',
        rooms:rooms
    };
    io.sockets.emit('room', output);
}

function getRoomList(){
    console.log('getRoomList 호출됨');
    console.log('ROOMS ->'+JSON.stringify(io.sockets.adpter.rooms));
    
    var rooms=[];
    
    Object.keys(io.sockets.adapter.rooms).forEach(function(roomId){
        console.log('현재방 ID:' + roomId);
        var curRoom=io.sockets.adapter.rooms[roomId];
        
        Object.keys(curRoom.sockets).forEach(function(key){
            if (roomId == key){
                found=true;
            }
        });
        if(!found){
            rooms.push(curRoom);
        }
    });
    return rooms;
}
*/

function sendResponse(socket, command, code, message){
    var output={
        command: command,
        code:code,
        message:message,
        
    };
    socket.emit('response', output);
}