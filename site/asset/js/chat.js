/**
 * 채팅의 View와 관련된 동작.
 */

let numOfMessage = 0;

function addMessage(userImg, userName, message) {
    numOfMessage++;
    $('#messages').append(getMessageTemplate(userImg, userName, message));
    $('#messages').animate({
        scrollTop: 100 * numOfMessage
    }, 0);
    moveToBottom();
}

function moveToBottom() {
    $('#messages').animate({
        scrollTop: 100 * numOfMessage
    }, 0);
}

function getMessageTemplate(userImg, userName, message) {
    return `<div class="dialog-message">
        <img class="message-img rounded-circle" src="` + userImg + `"
            width="30" height="30" />
        <span class="message-name">` + userName + `</span>
        <span class="message-msg">` + message + `</span>
    </div>`
}



