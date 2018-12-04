/**
 * 세션 및 로그인 관련
 */

exports.isLogin = function(req, res) {
    if (!req.session.user) {
        res.redirect('/signin')
        return false;
    }

    return true;
}