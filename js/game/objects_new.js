/**
 * Created by pauld on 21-5-2017.
 */

console.log("Objects.js loaded"); // check if loaded
var canvas = $( "#canvas" );
var selectedColor = "black";
var currentDrawer = "";
$('.currentColor').html(selectedColor);
var selectedSize = 10;
$('.widthPick').children()[1].style.backgroundColor = "grey";
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
        line.graphics.beginStroke(selectedColor).setStrokeStyle(selectedSize, "round", "round").moveTo(e.pageX - (e.pageX - e.offsetX), e.pageY - (e.pageY - e.offsetY));
        socket.emit('client_create_line', {"gameid": id, "color": selectedColor, "x": e.pageX - (e.pageX - e.offsetX), "y": e.pageY - (e.pageY - e.offsetY), "size": selectedSize});
    }
});

canvas.on("mouseup", function(e) {
    if(drawPermitted == 1) {
        mouseDown = 0;
        line.graphics.endStroke();
        socket.emit('client_end_line', {"gameid": id, "color": selectedColor, "x": e.pageX - (e.pageX - e.offsetX), "y": e.pageY - (e.pageY - e.offsetY), "size": selectedSize});
    }
});

canvas.on("mousemove", function(e) {
    if(canDraw == 1 && mouseDown == 1) {
        line.graphics._oldStrokeStyle = {"caps" : "round", "joints" : "round", "width" : selectedSize};
        line.graphics.lineTo(e.pageX - (e.pageX - e.offsetX), e.pageY - (e.pageY - e.offsetY));
        socket.emit('client_next_line_to', {"gameid" : id, "x" : line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].x, "y" : line.graphics._activeInstructions[line.graphics._activeInstructions.length - 1].y, "size" : line.graphics._strokeStyle.width});
        canDraw = 0;
        timeout();
    }
});

function timeout() {
    setTimeout(function() {
        canDraw = 1;
    }, 10);
}

function update() {
    stage.update();
}
setInterval(update, 10);

function hasPermission() {
    if(username == currentDrawer) {
        drawPermitted = 1;
    } else {
        drawPermitted = 0;
    }
}
setInterval(hasPermission, 100);

function changeColor(col) {
    selectedColor = col;
    $('.currentColor').html(col);
}

function changeWidth(wid) {
    selectedSize = wid;
    $('.widthPick').children()[0].style.backgroundColor = "white";
    $('.widthPick').children()[1].style.backgroundColor = "white";
    $('.widthPick').children()[2].style.backgroundColor = "white";
    $('.widthPick').children()[3].style.backgroundColor = "white";
    if(wid == 5) {
        $('.widthPick').children()[0].style.backgroundColor = "grey";
    } else if(wid == 10) {
        $('.widthPick').children()[1].style.backgroundColor = "grey";
    } else if(wid == 20) {
        $('.widthPick').children()[2].style.backgroundColor = "grey";
    } else if(wid == 40) {
        $('.widthPick').children()[3].style.backgroundColor = "grey";
    }
}

function scrollDownChat() {
    $('.chat').scrollTop($('.chat')[0].scrollHeight);
}
setInterval(scrollDownChat, 10);