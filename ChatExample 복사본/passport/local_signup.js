var LocalStrategy=require('passport-local').Strategy;

module.exports=new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
}, function(req, email, password, done){
    var paramName = req.param('name');
    console.log('passport의 local-signup 호출됨' + email + ',' + password + ',' + paramName);
});