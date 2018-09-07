const fs = require('fs');

const words = (function() {
    const words = fs.readFileSync("./words.txt", {encoding : "UTF-8"}).split(',');
    for(let i = 0; i < words.length; i++) {
        let occurances = 0;
        for(let k = 0; k < words.length; k++) {
            if(words[i] === words[k]) {
                occurances++;
                if(occurances > 1) {
                    words.splice(k, 1);
                }
            }
        }
    }
    console.log(words.length);
    return words;
})();

let io;

const games = {};
const Game = function(gameid) {
    this.gameid = gameid;

    this.drawing = [];

    this.players = []; //ID, Username, score
    this.currentPlayer = {
        id : "", //socket id
        username : "", //username
        index : 0, //index of usernames
        guessed : 0
    };

    this.getRandomWord = function() {
        return words[Math.floor(Math.random() * words.length)];
    };
    this.word = this.getRandomWord();

    this.reward = 250;
    this.rewardTicker = 50;
    this.rewardMin = 100;

    this.currentReward = this.reward;

    this.time = 60; //amount of time per round
    this.timer = 10; //Starting wait timer
    this.setup = 1;
    this.timerRoundEndStandard = 5;
    this.timerRoundEnd = this.timerRoundEndStandard;
    this.roundEnd = 0;

    this.line = {
        new : (x, y, width, colour, username) => {
            const data = {x : x, y : y, width : width, colour: colour, username : username};
            //console.log(username);
            this.emitMessage("line_new_server", data, username);
            this.drawing.push({action : "new", data : data});
        },
        next : (x, y, username) => {
            const data = {x : x, y : y, username : username};
            //console.log(username);
            this.emitMessage("line_next_server", data, username);
            this.drawing.push({action : "next", data : data});
        }
    };

    this.emitMessage = (name, data, next = "") => {
        for(let i in this.players) {
            if(this.players[i].username === next) continue;
            io.to(this.players[i].id).emit(name, data);
        }
    };
    this.newPlayer = (username, id) => {
        if(this.usernameTaken(username)) return;
        this.emitMessage("new_player", {username : username, score : 0});
        if(this.players.length !== 0 ) this.currentPlayer.index++;
        this.players.unshift(
            {
                id : id,
                username : username,
                score : 0
            }
        );
    };

    this.removePlayer = index => {
        const username = this.players[index].username;
        this.players.splice(index, 1);
        if(this.currentPlayer.index === this.players.length) { //if last one in line after splicing
            this.setCurrentPlayer(0);
        } else {
            this.setCurrentPlayer(this.currentPlayer.index);
        }
        this.timer = this.time;
        this.drawing = [];
        this.emitMessage("remove_player", {username : username, currentPlayer: this.currentPlayer});
    };

    this.usernameTaken = needle => {
        for(let i in this.players) {
            if(this.players[i].username === needle) return true;
        }
        return false;
    };

    this.setCurrentPlayer = index => {
        if(this.players.length === 0) { //kill itself
            delete games[this.gameid];
            return;
        }
        this.currentPlayer.id = this.players[index].id;
        this.currentPlayer.username = this.players[index].username;
        this.currentPlayer.index = index;

        const hidden = this.getHiddenWord();
        this.emitMessage("new_word", {word : hidden});
        io.to(this.currentPlayer.id).emit("new_word", {word : this.word});
    };

    this.getHiddenWord = function() {
        let string = "";
        for(let i = 0; i < this.word.length; i++) {
            if(this.word[i] === " ") {
                string += " ";
                continue;
            }
            string += "_";
        }
        return string;
    };

    this.getPlayers = () => {
        const players = [];
        for(let i in this.players) {
            players.push({
                username : this.players[i].username,
                score : this.players[i].score
            });
        }
        return players;
    };

    this.tick = () => {
        if(this.players.length === 0) return;

        let reset = false; //reset board

        this.timer--;

        if(this.hasEveryoneGuessed()) this.timer = 0;

        if(this.timer === 0) {
            if(this.timerRoundEnd > 0) {
                this.timer = 1; // set to one so it goes back to 0
                this.roundEnd = 1;
                this.emitMessage("new_word", {word : this.word});
                this.timerRoundEnd--;
            } else {
                this.roundEnd = 0;

                this.word = this.getRandomWord();

                if (this.players.length - 1 === this.currentPlayer.index) {
                    this.setCurrentPlayer(0);
                } else {
                    this.setCurrentPlayer(this.currentPlayer.index + 1);
                }

                reset = true;

                this.timer = this.time;
                this.timerRoundEnd = this.timerRoundEndStandard;
                this.drawing = [];
                this.currentReward = this.reward;

                for (let i in this.players) {
                    this.players[i].guessed = 0;
                }
            }
        }

        const info = {
            currentPlayer : this.currentPlayer.username,
            reset : reset,
            players : this.getPlayers(),
            timer : (function() {
                if(this.roundEnd) {
                    return this.timerRoundEnd + 1;
                } else {
                    return this.timer;
                }
            }.bind(this))()
        };
        //console.log(info);
        this.emitMessage("tick", info);
    };

    this.isSpoof = (username, id) => {
        for(let i in this.players) {
            if(this.players[i].username === username && this.players[i].id === id) {
                return false;
            }
        }
        return true;
    };

    this.hasGuessed = username => {
        for(let i in this.players) {
            if(this.players[i].username === username && this.players[i].guessed === 1) {
                return true;
            }
        }
        return false;
    };

    this.guess = (username, guess) => {
        //console.log(guess.toLowerCase());
        //console.log(this.word.toLowerCase());
        if(guess.toLowerCase() === this.word.toLowerCase() && !this.roundEnd) {
            let score = this.currentReward + this.timer;
            for(let i in this.players) {
                if(this.players[i].username === username) {
                    this.players[i].score += score;
                    this.players[i].guessed = 1;
                    io.to(this.players[i].id).emit("new_word", {word : this.word});
                    break;
                }
            }
            if(this.currentReward >= this.rewardMin) {
                this.currentReward -= this.rewardTicker;
            }
            this.emitMessage("new_guess_callback", {username : username, guessed : 1, score : score});
        } else {
            this.emitMessage("new_guess_callback", {username : username, message : guess});
        }
    };

    this.hasEveryoneGuessed = function() {
        if(this.players.length === 1) return false;
        let amountGuessed = 0;
        for(let i in this.players) {
            if(this.players[i].username === this.currentPlayer.username) {
                amountGuessed++;
                continue;
            }
            if(this.players[i].guessed === 1) {
                amountGuessed++;
            }
        }
        return amountGuessed === this.players.length;

    };

    setInterval(function() {
        this.tick();
    }.bind(this), 1000);
};

module.exports = {
    init : function(socket) {
        io = socket;
    },
    handle : socket => {
        /**
         * Create game
         */
        socket.on('create_game', data => {
            console.log(data);
            if(typeof data.name !== 'string' || typeof data.create !== 'number') {
                io.to(socket.id).emit('create_game_callback', {error : "Data invalid, refresh page and try again"});
                return;
            }
            if(data.name == 0) {
                io.to(socket.id).emit('create_game_callback', {error : "Code entered is empty"});
                return;
            }
            if(data.name !== data.name.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')) {
                io.to(socket.id).emit('create_game_callback', {error : "Please remove all special characters"});
                return;
            }
            if(typeof games[data.name] !== 'undefined') {
                io.to(socket.id).emit('create_game_callback', {error : "Name in use, join or choose a different name (WIP)"});
                return;
            }
            games[data.name] = new Game(data.name);
            io.to(socket.id).emit('create_game_callback', {url : "/game/" + data.name});
        });

        /**
         * Register user
         */
        socket.on('register_game_user', data => {
            console.log(data);
            if(typeof games[data.gameid] === 'undefined') {
                io.to(socket.id).emit('register_game_user_callback', {error : "Game not found"});
                return;
            }
            if(data.username === 'SERVER') {
                io.to(socket.id).emit('register_game_user_callback', {error : "Username SERVER is not allowed"});
                return;
            }
            if(games[data.gameid].usernameTaken(data.username)) {
                io.to(socket.id).emit('register_game_user_callback', {error : "Username already in use"});
                return;
            }
            /**
             * Register new player
             */
            games[data.gameid].newPlayer(data.username, socket.id);

            /**
             * Send vital data to client
             */
            const info = {
                players : games[data.gameid].getPlayers(),
                currentPlayer : games[data.gameid].currentPlayer.username,
                drawing : games[data.gameid].drawing,
                word : games[data.gameid].getHiddenWord()
            };
            io.to(socket.id).emit('register_game_user_callback', info);

            //console.log(games[data.gameid]);
        });

        /**
         * Create line
         */
        socket.on('line_new', data => {
            if(typeof games[data.gameid] === 'undefined') return;
            if(data.username !== games[data.gameid].currentPlayer.username) return;
            if(socket.id !== games[data.gameid].currentPlayer.id) return;
            if(games[data.gameid].isSpoof(data.username, socket.id)) return;
            games[data.gameid].line.new(data.x, data.y, data.width, data.colour, data.username);
        });

        /**
         * Line next
         */
        socket.on('line_next', data => {
            if(typeof games[data.gameid] === 'undefined') return;
            if(data.username !== games[data.gameid].currentPlayer.username) return;
            if(socket.id !== games[data.gameid].currentPlayer.id) return;
            if(games[data.gameid].isSpoof(data.username, socket.id)) return;
            games[data.gameid].line.next(data.x, data.y, data.username);
        });

        /**
         * New chat message (guess)
         */
        socket.on("new_guess", data => {
            if(data.guess == 0) return;
            if(data.guess !== data.guess.replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '')) return;
            if(typeof games[data.gameid] === 'undefined') return;
            if(data.username === games[data.gameid].currentPlayer.username && data.guess === games[data.gameid].word) return;
            if(games[data.gameid].isSpoof(data.username, socket.id)) return;
            if(games[data.gameid].hasGuessed(data.username)) return;

            games[data.gameid].guess(data.username, data.guess);
        });

        /**
         * User disconnect
         */
        socket.on('disconnect', () => {
             for(let i in games) {
                 for(let k in games[i].players) {
                     if(games[i].players[k].id === socket.id) {
                         games[i].removePlayer(k);
                     }
                 }
             }
        });

    }
};