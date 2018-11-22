let getWarningToast = function(str) {
    return '<div class="alert alert-warning col-md-8" role="alert">' + str + '</div>'
}

let getSuccessToast = function(str) {
    return '<div class="alert alert-success col-md-8" role="alert">' + str + '</div>'
} 

let getFailToast = function(str) {
    return '<div class="alert alert-danger col-md-8" role="alert">' + str + '</div>'
}



function showControlBox() {
    $('#container-control').css({
        display: "block",
        opacity: 0
    }).animate({
        opacity: 1
    }, 300);
}

function hideControlBox() {
    $('#container-control').css({
        display: "none"
    })
}