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

var database_loader=require('./database/database_loader');
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
    
    database_loader.init(app, config);
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
            if(login_ids[message.recepient]){
                io.sockets.connected[login_ids[message.recepient]].emit('message', message);
                
                sendResponse(socket, 'message', 200, 'ok');
            }
            else{
                sendResponse(socket, 'message', 400, '수신자 ID를 찾을 수 없습니다.');
            }
        }
        
    });
});

function sendResponse(socket, command, code, message){
    var output={
        command: command,
        code:code,
        message:message,
        
    };
    socket.emit('response', output);
}