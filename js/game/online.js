/**
 * Created by pauld on 21-5-2017.
 */


var GET = getUrlVars();

var id = GET['id'];

var username = prompt("Please enter a username", "");

if (username == null || username == "") {
    alert("You did not enter a username, please reconnect.");
    location.href = "/";
} else {
    socket.emit('client_enter_game', {"gameid" : id, "username" : username});
}

socket.on('server_send_error', function(data){
    alert(data.message);
    location.href = "/";
});

socket.on('server_new_dot', function(data) {
    var circle = new createjs.Shape();
    circle.graphics.beginFill(data.color).drawCircle(data.x, data.y, data.size);
    stage.addChild(circle);
});

socket.on('server_create_line', function(data) {
    line.graphics.beginStroke(data.color).setStrokeStyle(data.size).moveTo(data.x, data.y);
    circle.graphics.beginFill(selectedColor).drawCircle(line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].x, line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].y, selectedSize / 2);
});

socket.on('server_next_line_to', function(data) {
    line.graphics._oldStrokeStyle = data.size;
    circle.graphics.beginFill(data.color).drawCircle(data.x, data.y, data.size / 2);
    line.graphics.lineTo(data.x, data.y);
});

socket.on('server_end_line', function() {
    circle.graphics.beginFill(selectedColor).drawCircle(line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].x, line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].y, selectedSize / 2);
    line.graphics.endStroke();
});

socket.on('server_send_message', function(data) {
    $('.chat').append('<div><strong>' + data.username + ': </strong>' + data.message + '</div>');
});

socket.on('server_send_information', function(data) {
    if(data.nextTurn == 1) {
        mouseDown = 0;
        stage.removeAllChildren();
        line = new createjs.Shape();
        circle = new createjs.Shape();
        stage.addChild(circle);
        stage.addChild(line);
        stage.update();
    }
    currentDrawer = data.currentDrawer;
    actualTimeLeft = 65 - data.timeLeft;
    $('.timeLeft').html(actualTimeLeft);
    if(data.currentDrawer == username) {
        $('.wordSentence').html('You need to draw: <span class="currentWord" style="font-weight: bold;"></span>');
        $('.currentWord').html(data.currentWord);
    } else {
        $('.wordSentence').html('');
    }

    var players = $('.players');

    players.html('<h2 style="margin: 0; border-bottom: 1px solid black">Players</h2>');

    for(i = 0; i < data.players.length; i++) {
        players.append('<div class="col-sm-12" style="border-bottom: 1px solid black">' + data.players[i].username +
            '<br><span style="font-weight: bold;">Points: </span>' + data.players[i].points + '<br><span style="font-weight: bold;">Status:</span> ' + data.players[i].status + '</div>');
    }
});

$(document).keypress(function(e) {
    if(e.which == 13) {
        socket.emit('client_send_message', {"gameid" : id, "message" : $('.chatInput').val()});
        $('.chatInput').val('');
    }
});