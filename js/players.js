const Players = function() {
    this.username = (function() {
        const username = prompt('Username?');
        if(username) return username;
        location.href = "/?error=" + encodeURI("You didn't choose a username");
    })();
    this.players = [];
    this.canDraw = function() {
        return this.currentPlayer === this.username;
    };

    this.currentPlayer = "";
    this.newPlayer = function(data) {
        chat.addMessage("SERVER", data.username + " joined!");
        this.players.unshift(data); //username, score
        console.log("New player");
    };
    this.removePlayer = function(data) {
        chat.addMessage("SERVER", data.username + " left!");
        for(let i in this.players) {
            if(this.players[i].username === data.username) {
                this.players.splice(i, 1);
            }
        }
        if(this.currentPlayer === data.username) {
            game.stage.removeAllChildren();
            game.stage.clear();
        }
        this.currentPlayer = data.currentPlayer;
        console.log("Remove player");
    };
    this.handleRegisterCallback = function(data) {
        if(data.error) {
            location.href = "/?error=" + encodeURI(data.error);
            return;
        }
        console.log(data);
        game.drawingWord.html(data.word);
        this.players = data.players;
        this.currentPlayer = data.currentPlayer;
        for(let i = 0; i < data.drawing.length; i++) {
            switch(data.drawing[i].action) {
                case "new":
                    game.line.new(data.drawing[i].data.x, data.drawing[i].data.y, data.drawing[i].data.width, data.drawing[i].data.username);
                    break;
                case "next":
                    game.line.next(data.drawing[i].data.x, data.drawing[i].data.y, data.drawing[i].data.username);
                    break;
            }
        }
    };
    this.setCurrentPlayer = function(username) {
        this.currentPlayer = username;
    };
    this.addScore = function(username, score) {
        for(let i in this.players) {
            if(this.players[i].username === username) {
                this.players[i].score += score;
                break;
            }
        }
    };
};