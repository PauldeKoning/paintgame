/**
 * Created by pauld on 21-5-2017.
 */

console.log("Objects.js loaded"); // check if loaded
var canvas = $( "#canvas" );
var selectedColor = "DeepSkyBlue";
var selectedSize = 10;
var mouseDown = 0;
var lastMouseDown = 0;
var lastMousePosition = [0, 0]; // make var for current mouse position (default to 0)
var currentMousePosition = [0, 0]; // make var for current mouse position (default to 0)
var socket = io.connect();

console.log("Initializing..."); // check if initializing
var stage = new createjs.Stage("canvas");
canvas.on("mousedown", function(e) {
    mouseDown = 1;
});

canvas.on("mouseup", function(e) {
    mouseDown = 0;
});

canvas.on("mousemove", function(e) {
    currentMousePosition = [e.pageX, e.pageY];
    if(mouseDown == 1) {
        if(lastMouseDown !== 0) {
            checkLineNeeded(lastMousePosition, currentMousePosition);
        } else {
            //drawDot(currentMousePosition[0], currentMousePosition[1]);
        }
    }
    lastMouseDown = mouseDown;
    lastMousePosition = currentMousePosition;
});

function checkLineNeeded(mouse1, mouse2) {

    if(mouse1[0] < mouse2[0] - 1 || mouse1[0] > mouse2[0] + 1) {
        console.log("incorrect move!");
        var ydiff = mouse2[1] - mouse1[1];
        if(mouse1[0] < mouse2[0] - 1) {
            xdiff = mouse2[0] - mouse1[0] - 1;
            ydiffLast = 0;
            for(i = 0; i < mouse2[0] - mouse1[0]; i++) {
                if(mouse1[1] !== mouse2[1]) {
                    xdiffPercent = i/xdiff;
                    if(ydiffLast < Math.floor(xdiffPercent * ydiff) - 1) {
                        tempVerschil = (Math.floor(xdiffPercent * ydiff) - 1 - ydiffLast) / 6;
                        for(j = 0; j < tempVerschil; j++) {
                            tempPercent = j/tempVerschil;
                            drawDot(mouse1[0] + i + 1, Math.floor(mouse1[1] + tempPercent * tempVerschil + ydiffLast));
                        }
                    } else {
                        tempVerschil = (Math.floor(xdiffPercent * ydiff) - 1 - ydiffLast) / 6;
                        for(j = tempVerschil; j < 0; j++) {
                            tempPercent = j/tempVerschil;
                            drawDot(mouse1[0] + i + 1, Math.floor(mouse1[1] + tempPercent * tempVerschil + ydiffLast));
                        }
                    }
                    ydiffLast = Math.floor(xdiffPercent * ydiff);
                } else {
                    drawDot(mouse1[0] + i + 1, mouse1[1]);
                }
            }
        }
        if(mouse1[0] > mouse2[0] + 1) {
            xdiff = mouse1[0] - mouse2[0] - 1;
            ydiffLast = 0;
            for(i = 0; i < mouse1[0] - mouse2[0]; i++) {
                if(mouse2[1] !== mouse1[1]) {
                    xdiffPercent = i/xdiff;
                    if(ydiffLast < Math.floor(xdiffPercent * ydiff) - 1) {
                        tempVerschil = (Math.floor(xdiffPercent * ydiff) - 1 - ydiffLast) / 6;
                        for(j = 0; j < tempVerschil; j++) {
                            tempPercent = j/tempVerschil;
                            drawDot(mouse1[0] - i + 1, Math.floor(mouse1[1] + tempPercent * tempVerschil + ydiffLast));
                        }
                    } else {
                        tempVerschil = (Math.floor(xdiffPercent * ydiff) - 1 - ydiffLast) / 6;
                        for(j = tempVerschil; j < 0; j++) {
                            tempPercent = j/tempVerschil;
                            drawDot(mouse1[0] - i + 1, Math.floor(mouse1[1] + tempPercent * tempVerschil + ydiffLast));
                        }
                    }
                    ydiffLast = Math.floor(xdiffPercent * ydiff);
                } else {
                    drawDot(mouse1[0] - i + 1, mouse1[1]);
                }
            }
        }
    }
}


function drawDot(x, y) {
    var circle = new createjs.Shape();
    circle.graphics.beginFill(selectedColor).drawCircle(x, y, selectedSize);
    stage.addChild(circle);
    socket.emit('client_create_new_object', {"gameid" : id, "color" : selectedColor, "x" : x, "y" : y, "size" : selectedSize});
}


function drawDots() {
    if(lastMouseDown == 0 && mouseDown == 1) {
        var circle = new createjs.Shape();
        circle.graphics.beginFill(selectedColor).drawCircle(currentMousePosition[0], currentMousePosition[1], selectedSize);
        stage.addChild(circle);
        socket.emit('client_create_new_object', {"gameid" : id, "color" : selectedColor, "x" : currentMousePosition[0], "y" : currentMousePosition[1], "size" : selectedSize});
    } else if(lastMouseDown == 1 && mouseDown == 1) {
        var circle = new createjs.Shape();
        circle.graphics.beginFill(selectedColor).drawCircle(currentMousePosition[0], currentMousePosition[1], selectedSize);
        stage.addChild(circle);
        socket.emit('client_create_new_object', {"gameid" : id, "color" : selectedColor, "x" : currentMousePosition[0], "y" : currentMousePosition[1], "size" : selectedSize});
    }
}
setInterval(drawDots, 15);

function update() {
    stage.update();
}
setInterval(update, 10);
