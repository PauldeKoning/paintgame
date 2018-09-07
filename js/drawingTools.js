const DrawingTools = function() {
    this.tools = $('#tools');
    this.showTools = function() {
        this.tools.removeClass('w3-hide');
        scoreboard.scoreboardDOM.css('height', 'calc(100% - 183px)');
    };
    this.removeTools = function() {
        this.tools.addClass('w3-hide');
        scoreboard.scoreboardDOM.css('height', '100%');
    };
};