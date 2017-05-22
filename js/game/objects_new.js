/**
 * Created by pauld on 21-5-2017.
 */

console.log("Objects.js loaded"); // check if loaded
var canvas = $( "#canvas" );
var selectedColor = "DeepSkyBlue";
var selectedSize = 10;
var mouseDown = 0;
var canDraw = 1;
var drawPermitted = 0;
var circle = new createjs.Shape();
var line = new createjs.Shape();
var socket = io.connect();

console.log("Initializing..."); // check if initializing
var stage = new createjs.Stage("canvas");

stage.addChild(circle);
stage.addChild(line);

canvas.on("mousedown", function(e) {
    if(drawPermitted == 1) {
        mouseDown = 1;
        circle.graphics.beginFill(selectedColor).drawCircle(e.pageX - (e.pageX - e.offsetX), e.pageY - (e.pageY - e.offsetY), selectedSize / 2);
        line.graphics.beginStroke(selectedColor).setStrokeStyle(selectedSize).moveTo(e.pageX - (e.pageX - e.offsetX), e.pageY - (e.pageY - e.offsetY));
        socket.emit('client_create_line', {"gameid": id, "color": selectedColor, "x": e.pageX - (e.pageX - e.offsetX), "y": e.pageY - (e.pageY - e.offsetY), "size": selectedSize});
    }
});

canvas.on("mouseup", function(e) {
    if(drawPermitted == 1) {
        mouseDown = 0;
        circle.graphics.beginFill(selectedColor).drawCircle(line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].x, line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].y, selectedSize / 2);
        line.graphics.endStroke();
        socket.emit('client_end_line', {"gameid": id, "color": selectedColor, "x": e.pageX - (e.pageX - e.offsetX), "y": e.pageY - (e.pageY - e.offsetY), "size": selectedSize});
    }
});

canvas.on("mousemove", function(e) {
    if(canDraw == 1 && mouseDown == 1) {
        line.graphics._oldStrokeStyle = selectedSize;
        line.graphics.lineTo(e.pageX - (e.pageX - e.offsetX), e.pageY - (e.pageY - e.offsetY));
        socket.emit('client_next_line_to', {"gameid" : id, "x" : line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].x, "y" : line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].y, "size" : line.graphics._strokeStyle.width});
        circle.graphics.beginFill(selectedColor).drawCircle(line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].x, line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].y, selectedSize / 2);
        canDraw = 0;
        timeout();
    }
});

function timeout() {
    setTimeout(function() {
        canDraw = 1;
    }, 25);
}

function update() {
    stage.update();
}
setInterval(update, 10);

function hasPermission() {
    if(username == $('#currentDrawer').html()) {
        drawPermitted = 1;
    } else {
        drawPermitted = 0;
    }
}
setInterval(hasPermission, 100);

function changeColor(col) {
    selectedColor = col;
}