const Connection = function() {
    this.gameid = $.cookie("gameid");

    this.socket = io.connect();

    this.newGuess = function() {
        console.log("sending message");
        const guess = chat.chatInput.val();
        this.socket.emit("new_guess", {
            gameid : this.gameid,
            username : players.username,
            guess : guess
        });
        chat.chatInput.val("");
    };

    this.line = {
        new : function(x, y, width, colour) {
            if(!players.canDraw()) return;
            this.socket.emit('line_new', {
                gameid : this.gameid,
                username : players.username,
                x : x,
                y : y,
                width : width,
                colour : colour
            });
        }.bind(this),
        next : function(x, y) {
            if(!players.canDraw()) return;
            this.socket.emit('line_next', {
                gameid : this.gameid,
                username : players.username,
                x : x,
                y : y
            });
        }.bind(this),
    };
    this.init = (function() {
        this.socket.emit("register_game_user", {gameid : this.gameid, username : players.username});

        /**
         * When you join, set current game data
         */
        this.socket.on("register_game_user_callback", function(data) {
            players.handleRegisterCallback(data);
        }.bind(this));

        /**
         * When a new player gets reported by server
         */
        this.socket.on("new_player", function(data) {
            console.log("adding player");
            players.newPlayer(data);
        }.bind(this));

        /**
         * When a player leave gets reported by server
         */
        this.socket.on("remove_player", function(data) {
            console.log("removing player");
            players.removePlayer(data);
        }.bind(this));

        /**
         * Secondly tick
         */
        this.socket.on("tick", function(data) {
            if(players.canDraw()) {
                drawingTools.showTools();
            } else {
                drawingTools.removeTools();
            }

            game.timer.html(data.timer);
            players.setCurrentPlayer(data.currentPlayer);

            players.players = data.players;
            scoreboard.update();

            if(data.reset) {
                game.stage.removeAllChildren();
                game.stage.clear();
            }

        }.bind(this));

        this.socket.on("line_new_server", function(data) {
            //console.log("New line Server");
            //console.log(data);
            game.line.new(data.x, data.y, data.width, data.colour, 0);
        }.bind(this));

        this.socket.on("line_next_server", function(data) {
            //console.log("Line Next");
            game.line.next(data.x, data.y, 0);
        }.bind(this));

        this.socket.on("new_guess_callback", function(data) {
            console.log("receiving message");
            console.log(data);
            if(data.guessed === 1) {
                chat.addMessage("SERVER", data.username + " correctly guessed!");
                players.addScore(data.username, data.score);
                scoreboard.update();
                return;
            }
            chat.addMessage(data.username, data.message);
        }.bind(this));

        this.socket.on("new_word", function(data) {
            game.drawingWord.html(data.word);
        });
    }.bind(this))();
};