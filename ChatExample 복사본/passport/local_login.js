var LocalStrategy=require('passport-local').Strategy;

module.exports=new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
}, function(req, email, password, done){
    console.log('passport의 local-login 호출됨' + email + ',' + password );
});