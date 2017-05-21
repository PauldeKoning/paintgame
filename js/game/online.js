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
    circle.graphics.beginFill(data.color).drawCircle(data.x, data.y, data.size / 2);
});

socket.on('server_next_line_to', function(data) {
    line.graphics._oldStrokeStyle = data.size;
    circle.graphics.beginFill(data.color).drawCircle(data.x, data.y, data.size / 2);
    line.graphics.lineTo(data.x, data.y);
});

socket.on('server_end_line', function(data) {
    circle.graphics.beginFill(data.color).drawCircle(data.x, data.y, data.size / 2);
    line.graphics.endStroke();
});

socket.on('server_send_information', function(data) {
    console.log(data);
    $('#currentDrawer').html(data.currentDrawer);
    $('#timeLeft').html(data.timeLeft);
});