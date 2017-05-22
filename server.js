/**
 * Created by pauld on 7-3-2017.
 */
var express = require('express');
app = express();
var http = require('http');
var fileExists = require('file-exists');
var server = http.createServer(app);
var io = require('socket.io')(server);
var port = 255;
var games = [];

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
    });
    client.on('client_join_game', function(data) {
        if(data !== "") {
            joined = 0;
            for (i = 0; i < games.length; i++) {
                if (games[i].id == data) {
                    io.to(client.id).emit('server_join_game_link', {"status": "success", "link": "/game.html?id=" + data});
                    console.log("User Is Joining a Game");
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
                    games[i].players.push({"clientid" : client.id, "username" : data.username, "status" : "Waiting"});
                    console.log("User Joined Game");
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
                for(j = 0; j < games[i].players.length; j++) {
                    io.to(games[i].players[j].clientid).emit('server_send_message', {"username" : username, "message" : data.message});
                }
            }
        }
    });
    client.on('disconnect', function() {
        for (i = 0; i < games.length; i++) {
            for(j = 0; j < games[i].players.length; j++) {
                if(games[i].players[j].clientid == client.id) {
                    games[i].players.splice(j, 1);
                }
            }
        }
    });
});

function sendInformationAndUpdate() {
    for(i = 0; i < games.length; i++) {
        if(games[i].currentDrawer.username == "none") {
            if(games[i].players.length > 0) {
                games[i].currentDrawer = games[i].players[0];
                games[i].players[0].status = "Drawing";
                games[i].lastPlayer = 0;
            }
        }
        var nextTurn = 0;
        if(games[i].drawTimer >= 10) {
            nextTurn = 1;
            if(games[i].currentDrawer.clientid == games[i].players[games[i].players.length - 1].clientid) {
                games[i].lastPlayer = 0;
            } else {
                games[i].lastPlayer++;
            }
            games[i].currentDrawer = games[i].players[games[i].lastPlayer];
            games[i].players[games[i].lastPlayer].status = "Drawing";
            games[i].drawTimer = 0;
        }
        games[i].drawTimer++;

        for(j = 0; j < games[i].players.length; j++) {
            if(games[i].players[j].username !== games[i].currentDrawer.username) {
                games[i].players[j].status = "Guessing"
            }
            io.to(games[i].players[j].clientid).emit('server_send_information',
                {"currentDrawer" : games[i].currentDrawer.username,
                    "timeLeft" : games[i].drawTimer,
                    "nextTurn" : nextTurn,
                    "players" : games[i].players
                });
        }
    }
}

setInterval(sendInformationAndUpdate, 1000);

function Game() {
    this.id = games.length;
    this.players = [];
    this.currentDrawer = {"username" : "none"};
    this.drawTimer = 0;
    this.lastPlayer = 0;
}

