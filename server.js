const socketGame = require('./socket_game');

const Server = function(port) {
      this.express = require('express');
      this.app = this.express();
      this.path = require('path');
      this.port = port;
      this.server = require('http').Server(this.app);
      this.io = require('socket.io')(this.server);
      this.add = {
          static: function (route, folder) {
              this.app.use(route, this.express.static(this.path.join(__dirname, folder)));
          }.bind(this)
      };
      this.start = function() {
          this.server.listen(this.port, function() {
              console.log("Server hosted on port: " + 80);
          });
      };
};

const server = new Server(80);

server.app.get('/', function(req, res) {
   res.sendFile(server.path.join(__dirname + "/views/index.html"));
});
server.app.get('/ui', function(req, res) {
    res.sendFile(server.path.join(__dirname + "/views/gameui.html"));
});
server.app.get('/game/:id', function(req, res) {
    res.cookie("gameid", req.params.id);
    res.sendFile(server.path.join(__dirname + "/views/game.html"));
});
server.add.static('/css', 'css');
server.add.static('/js', 'js');
server.add.static('/img', 'img');

server.start();

socketGame.init(server.io);
server.io.on('connection', function(socket) {
    socketGame.handle(socket);
});