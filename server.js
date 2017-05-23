/**
 * Created by pauld on 7-3-2017.
 */
var express = require('express');
app = express();
var http = require('http');
var fileExists = require('file-exists');
var server = http.createServer(app);
var io = require('socket.io')(server);
var fs = require('file-system');
var port = 80;
var serverid = 0;
var games = [];
var words = [];

fs.readFile('words.txt', 'utf8', function(err, data) {
    if (err) throw err;
    console.log('Words have been found and are loading into array...');
    words = data.split(',');
});

app.use('/css', express.static(__dirname + '/css'));
app.use('/js', express.static(__dirname + '/js'));
app.use('/api', express.static(__dirname + '/api'));
app.use(function(req, res, next) {
    if(req.url == "/") {
        req.url = "/index";
    }
    if(fileExists.sync("views" + req.url + ".html")) {
        req.url = req.url + ".html";
    } else if(fileExists.sync("views" + req.url + ".php")) {
        req.url = req.url + ".php";
    } else if(req.url.startsWith("/game")) {
        req.url = "/game.html";
    } else {
        req.url = "404.html";
    }
    next();
}, express.static(__dirname + '/views'));

server.listen(port);
console.log("Server is listening on port: " + port);


io.on('connection', function(client) {
    client.on('client_create_game', function() {
        games.push(new Game());
        io.to(client.id).emit('server_join_game_link', {"status" : "success", "link" : "/game.html?id=" + (games.length - 1)});
        console.log("New Game Made");
        serverid++;
    });
    client.on('client_join_game', function(data) {
        if(data !== "") {
            joined = 0;
            for (i = 0; i < games.length; i++) {
                if (games[i].id == data) {
                    io.to(client.id).emit('server_join_game_link', {"status": "success", "link": "/game.html?id=" + data});
                    joined = 1;
                }
            }
            if(joined == 0) {
                io.to(client.id).emit('server_join_game_link', {"status": "error", "message": "Game ID is not found..."});
            }
        } else {
            io.to(client.id).emit('server_join_game_link', {"status": "error", "message": "Input a number in the field!"});
        }
    });
    client.on('client_enter_game', function(data) {
        joined = 0;
        for (i = 0; i < games.length; i++) {
            if (games[i].id == data.gameid) {
                usernameTaken = 0;
                for(j = 0; j < games[i].players.length; j++) {
                    if(games[i].players[j].username == data.username) {
                        usernameTaken = 1;
                    }
                }
                if(usernameTaken == 0) {
                    games[i].players.push({"clientid" : client.id, "username" : data.username, "status" : "Waiting", "justJoined" : 1, "points" : 0, "hasGuessed" : 0});
                } else {
                    io.to(client.id).emit('server_send_error', {"message": "Username is already taken..."});
                }
                joined = 1;
            }
        }
        if(joined == 0) {
            io.to(client.id).emit('server_send_error', {"message": "Game doesn't exist"});
        }
    });
    client.on('client_create_new_object', function(data) {
        for (i = 0; i < games.length; i++) {
            if (games[i].id == data.gameid) {
                for(j = 0; j < games[i].players.length; j++) {
                    if(games[i].players[j].clientid !== client.id) {
                        io.to(games[i].players[j].clientid).emit('server_new_dot', {"color" : data.color, "x" : data.x, "y" : data.y, "size" : data.size});
                    }
                }
            }
        }
    });
    client.on('client_next_line_to', function(data) {
        for (i = 0; i < games.length; i++) {
            if (games[i].id == data.gameid) {
                for(j = 0; j < games[i].players.length; j++) {
                    if(games[i].players[j].clientid !== client.id && games[i].currentDrawer.clientid == client.id) {
                        io.to(games[i].players[j].clientid).emit('server_next_line_to', {"color" : data.color, "x" : data.x, "y" : data.y, "size" : data.size});
                    }
                }
            }
        }
    });
    client.on('client_create_line', function(data) {
        for (i = 0; i < games.length; i++) {
            if (games[i].id == data.gameid) {
                for(j = 0; j < games[i].players.length; j++) {
                    if(games[i].players[j].clientid !== client.id && games[i].currentDrawer.clientid == client.id) {
                        io.to(games[i].players[j].clientid).emit('server_create_line', {"color" : data.color, "x" : data.x, "y" : data.y, "size" : data.size});
                    }
                }
            }
        }
    });
    client.on('client_end_line', function(data) {
        for (i = 0; i < games.length; i++) {
            if (games[i].id == data.gameid) {
                for(j = 0; j < games[i].players.length; j++) {
                    if(games[i].players[j].clientid !== client.id && games[i].currentDrawer.clientid == client.id) {
                        io.to(games[i].players[j].clientid).emit('server_end_line', {"color" : data.color, "x" : data.x, "y" : data.y, "size" : data.size});
                    }
                }
            }
        }
    });
    client.on('client_send_message', function(data) {
        for (i = 0; i < games.length; i++) {
            if (games[i].id == data.gameid) {
                var username = "ERROR";
                for(j = 0; j < games[i].players.length; j++) {
                    if(games[i].players[j].clientid == client.id) {
                        username = games[i].players[j].username;
                    }
                }
                if(data.message !== "") {
                    if(data.message == games[i].currentWord) {
                        if(client.id !== games[i].currentDrawer.clientid) {
                            for (j = 0; j < games[i].players.length; j++) {
                                if(games[i].players[j].clientid == client.id && games[i].players[j].hasGuessed == 0 && games[i].drawTimer <= 60) {
                                    io.to(games[i].players[j].clientid).emit('server_send_message', {"username": "SERVER", "message": username + " has guessed the word!"});
                                    games[i].players[j].points = games[i].players[j].points + 60 - games[i].drawTimer;
                                    games[i].players[j].hasGuessed = 1;
                                }
                            }
                        }
                    } else {
                        for (j = 0; j < games[i].players.length; j++) {
                            io.to(games[i].players[j].clientid).emit('server_send_message', {"username": username, "message": data.message});
                        }
                    }
                }
            }
        }
    });
    client.on('disconnect', function() {
        for (i = 0; i < games.length; i++) {
            for(j = games[i].players.length - 1; j >= 0; j--) {
                if(games[i].players[j].clientid == client.id) {
                    games[i].players.splice(j, 1);
                }
            }
        }
    });
});

function sendInformationAndUpdate() {
    for(i = games.length - 1; i >= 0; i--) {
        if(games[i].players.length == 0 && games[i].currentDrawer.username !== "none") {
            games.splice(i, 1);
        }
    }
    for(i = 0; i < games.length; i++) {
        var nextTurn = 0;
        if(games[i].drawTimer >= 60) {
            for (j = 0; j < games[i].players.length; j++) {
                games[i].players[j].status = "Waiting";
                games[i].players[j].justJoined = 1;
            }
            if (games[i].drawTimer >= 65) {
                games[i].currentWord = words[Math.floor(Math.random() * words.length - 1)];
                for (j = 0; j < games[i].players.length; j++) {
                    games[i].players[j].justJoined = 0;
                    games[i].players[j].hasGuessed = 0;
                }
                if (games[i].currentDrawer.username == "none") {
                    if (games[i].players.length > 0) {
                        games[i].currentDrawer = games[i].players[0];
                        games[i].players[0].status = "Drawing";
                        games[i].lastPlayer = 0;
                        games[i].lastPlayerLength = games[i].players.length;
                    }
                }
                nextTurn = 1;
                if (games[i].players.length == 0) {
                    games[i].currentDrawer.username = ""; // make something different than none to delete
                    break;
                } else if (games[i].lastPlayerLength > games[i].players.length) {
                    games[i].lastPlayer = 0;
                } else if (games[i].currentDrawer.clientid == games[i].players[games[i].players.length - 1].clientid) {
                    games[i].lastPlayer = 0;
                } else {
                    games[i].lastPlayer++;
                }
                games[i].currentDrawer = games[i].players[games[i].lastPlayer];
                games[i].players[games[i].lastPlayer].status = "Drawing";
                games[i].drawTimer = 0;
                games[i].lastPlayerLength = games[i].players.length;
            }
        }
        games[i].drawTimer++;

        for(j = 0; j < games[i].players.length; j++) {
            if(games[i].players[j].username !== games[i].currentDrawer.username && games[i].currentDrawer.username !== "none" && games[i].players[j].justJoined == 0) {
                games[i].players[j].status = "Guessing"
            }
            io.to(games[i].players[j].clientid).emit('server_send_information',
                {"currentDrawer" : games[i].currentDrawer.username,
                    "timeLeft" : games[i].drawTimer,
                    "nextTurn" : nextTurn,
                    "currentWord" : games[i].currentWord,
                    "players" : games[i].players
                });
        }
    }
}

setInterval(sendInformationAndUpdate, 1000);

function Game() {
    this.id = serverid;
    this.players = [];
    this.currentDrawer = {"username" : "none"};
    this.drawTimer = 45;
    this.lastPlayer = 0;
    this.lastPlayerLength = 0;
    this.currentWord = "";
}

