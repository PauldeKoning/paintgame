const Chat = function() {
    this.chatDOM = $('#chatContent');
    this.chatInput = $('#chatInput');
    this.addMessage = function(username, message) {
        if(username === "SERVER") {
            const string =
                '<div class="chatMessage w3-border-top">' +
                '   <b>' + message + '</b>' +
                '</div>';
            this.chatDOM.append(string);
            return;
        }
        const string =
            '<div class="chatMessage w3-border-top">' +
            '   <b>' + username + ':</b> ' + message +
            '</div>';
        this.chatDOM.append(string);
    }
};