$(document).ready(function () {
    let numOfMessage = 0;

    $(".btn-dialog-toggle").click(function () {
        $("#dialog-content").toggle();
    })

    $('#chat-input input').keypress(function (event) {
        if (event.keyCode == 13) {
            let msg = $(this).val();
            $(this).val("");

            addMessage(msg);
        }
    });

    function addMessage(message) {
        numOfMessage++;
        $('#messages').append(getMessageTemplate(message));
        $('#messages').animate({
            scrollTop: 100 * numOfMessage
        }, 0);
    }

    function getMessageTemplate(message) {
        return `<div class="dialog-message">
        <img class="message-img rounded-circle" src="https://lh6.googleusercontent.com/-hezxJKyrbUs/AAAAAAAAAAI/AAAAAAAAADs/tJTe8OEjjBs/photo.jpg%3E"
            width="30" height="30" />
        <span class="message-name">이름</span>
        <span class="message-msg">` + message + `</span>
    </div>`
    }
})