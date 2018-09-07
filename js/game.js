const Game = function() {
    this.stageDoc = null;
    this.stage = null;
    this.isDrawing = false;
    this.outOfFrame = true;
    this.drawingWord = $('#drawingWord');
    this.timer = $('#timer');
    this.selectedColour = $('#selectedColour');

    this.width = 4;
    this.colour = "black";

    this.standardResolution = [1280, 720];

    this.scaleToStandard = function(x, y) {
        const scaleMultiX = this.standardResolution[0] / this.stageDoc.innerWidth();
        const scaleMultiY = this.standardResolution[1] / this.stageDoc.innerHeight();
        return [x * scaleMultiX, y * scaleMultiY];
    };
    this.scaleToLocal = function(x, y) {
        const scaleMultiX = this.stageDoc.innerWidth() / this.standardResolution[0];
        const scaleMultiY = this.stageDoc.innerHeight() / this.standardResolution[1];
        return [x * scaleMultiX, y * scaleMultiY];
    };

    this.calculateStageSize = function() {
        this.stage.canvas.width = this.stageDoc.innerWidth();
        this.stage.canvas.height = this.stageDoc.innerHeight();
        this.update();
    };

    this.setColour = function(colour) {
        this.colour = colour;
        this.selectedColour.css('background-color', colour);
    };

    this.widthDivs = {6 :$('#width6'), 12 : $('#width12'), 24 : $('#width24'), 32 : $('#width32')};

    this.setWidth = function(width) {
        for(let i in this.widthDivs) {
            this.widthDivs[i].removeClass('w3-gray');
        }
        this.widthDivs[width].addClass('w3-gray');
        this.width = width;
    };

    this.init = function() {
        this.setWidth(6);
        this.setColour("black");
        this.stage = new createjs.Stage("demoCanvas");
        this.stageDoc = $('#demoCanvas');

        $(window).resize(function() {
            this.calculateStageSize()
        }.bind(this));
        this.calculateStageSize();

        $(document).mousedown(function(e) {
            if(this.outOfFrame) return;
            if(players.canDraw()) {
                const correctedValues = this.scaleToStandard(e.pageX - this.stageDoc.offset().left, e.pageY - this.stageDoc.offset().top);
                this.line.new(correctedValues[0], correctedValues[1], this.width, this.colour);
            }
            this.isDrawing = true;
        }.bind(this));

        $(document).mouseup(function() {
            this.isDrawing = false;
        }.bind(this));

        this.stageDoc.mouseout(function(e) {
            this.outOfFrame = true;
        }.bind(this));

        this.stageDoc.on("mousemove", function(e) {
            if(this.outOfFrame && this.isDrawing) {
                if(players.canDraw()) {
                    const correctedValues = this.scaleToStandard(e.pageX - this.stageDoc.offset().left, e.pageY - this.stageDoc.offset().top);
                    this.line.new(correctedValues[0], correctedValues[1], this.width, this.colour);
                }
                this.outOfFrame = false;
            } else if(this.outOfFrame) {
                this.outOfFrame = false;
            } else if(this.isDrawing) {
                if(players.canDraw()) {
                    const correctedValues = this.scaleToStandard(e.pageX - this.stageDoc.offset().left, e.pageY - this.stageDoc.offset().top);
                    this.line.next(correctedValues[0], correctedValues[1]);
                }
            }
        }.bind(this));
    };
    this.line = {
        current : undefined,
        new : function(x, y, width, colour, sendServer = 1) {
            this.current = new createjs.Shape();
            const correctedValues = this._scaleToLocal(x, y);
            this.current.graphics.setStrokeStyle(width, 'round', 'round').beginStroke(colour).moveTo(correctedValues[0], correctedValues[1]);
            this.current.graphics.lineTo(correctedValues[0], correctedValues[1]);
            this._add(this.current);
            this._update();

            //send to server
            //console.log("Next");
            //console.log(sendServer);
            if(!sendServer) return;
            connection.line.new(x, y, width, colour);
        },
        next : function(x, y, sendServer = 1) {
            //console.log("next line");
            if(!this.current) return;
            const correctedValues = this._scaleToLocal(x, y);
            this.current.graphics.lineTo(correctedValues[0], correctedValues[1]);
            this._update();

            //send to server
            //console.log("Next");
            //console.log(sendServer);
            if(!sendServer) return;
            connection.line.next(x, y);
        },
        _add : function(obj) {
            this.add(obj);
        }.bind(this),
        _update : function() {
            this.update();
        }.bind(this),
        _scaleToLocal : function(x, y) {
            return this.scaleToLocal(x, y);
        }.bind(this),
        _scaleToStandard : function(x, y) {
            return this.scaleToStandard(x, y);
        }.bind(this)
    };
    this.add = function(obj) {
        this.stage.addChild(obj);
    };
    this.update = function() {
        this.stage.update();
    }
};