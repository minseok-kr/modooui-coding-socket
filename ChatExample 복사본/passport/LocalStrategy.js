//npm install passport-local --save//

var passport=require('passport')
,LocalStrategy=require('passport-local').Strategy;

passport.use(new LocalStrategy(
    function(username, password, done){
        UserModel.fineOne({username: username}, function(errr, user){
            if(err){return done(err);}
            if(!user){
                
                return done(null, false,{message: 'Incorrect username'});
            }
            if (!user.validPassword(password)){
                return done(null, false,{message: 'Incorrect password'});
            }
            return done(null, user);
        });
    }));