/**
*   빌드, 채점을 담당하는 모듈
*/

const fs = require('fs');
var exec = require('child_process').exec, child;

exports.buildCode = function(language, filename, code, callback) {
    
    
    let encoded = "#-*-coding:utf-8\n"

    // 파일 만들고.
    fs.writeFile("tmp/" + filename, encoded + code, function(err) {
        if (err) {
            return console.log(err);
        }
        console.log("File was saved.")

        // 컴파일.
        let opts = {
            encoding: 'utf8',
            timeout: 2000,
            maxBuffer: 10*1024,
            killSignal: 'SIGTERM',
            cwd: null,
            env: null
        }

        child = exec("python tmp/" + filename, opts, function(error, stdout, stderr) {
            console.log('stdout: ' + stdout);
            console.log('stderr: ' + stderr);
            if (error !== null) {
                console.log("exec error: " + error);
            }

            let status = ""
            if (error == null) {
                status = "success"    
            } else {
                status = "fail"
            }

            callback({ status: status, stdout: stdout, stderr: stderr, error: error });
        })
    })
}