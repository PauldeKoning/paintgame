const Scoreboard = function() {
    this.scoreboardDOM = $('#scoreboard');
    this.playersSorted = [];
    this.sortPlayers = function() {
        this.playersSorted = [];

        const player = players.players.slice(0);
        const playersLength = player.length;
        let currentPosition = 0;
        for(let i = 0; i < playersLength; i++) {
            let highestNumber = -1;
            let currentHighest = -1;
            for(let k in player) {
                if(player[k].score > highestNumber) {
                    currentHighest = k;
                    highestNumber = player[k].score;
                }
            }
            this.playersSorted[currentPosition] = player[currentHighest];
            player.splice(currentHighest, 1);
            currentPosition++;
        }

        /*
        for(let i in this.players) {
            let highestPosition = -1;
            for(let k in this.playersSorted) {
                console.log(this.players[i].score + " - " + this.playersSorted[k].score);
                if(this.players[i].score > this.playersSorted[k].score) {
                    highestPosition = k;
                } else {
                    break;
                }
            }
            if(highestPosition > -1) {
                this.playersSorted.unshift(this.players[i]);
            } else {
                this.playersSorted.push(this.players[i]);
            }
        }
        */

        let highestNow = this.playersSorted[0].score;
        let positionNow = 1;
        for(let i in this.playersSorted) {
            if(this.playersSorted[i].score === highestNow) {
                this.playersSorted[i].position = positionNow;
            } else {
                positionNow++;
                highestNow = this.playersSorted[i].score;
                this.playersSorted[i].position = positionNow;
            }
        }
    };
    this.update = function() {
        scoreboard.sortPlayers();
        this.scoreboardDOM.html('');
        for(let i in this.playersSorted) {
            const string =
                '<div class="w3-border-bottom w3-border-gray">' +
                '   <table class="w3-center hunwidth">' +
                '       <tr>' +
                '           <td class="w3-bold number">' +
                '               #' + this.playersSorted[i].position +
                '           </td>' +
                '           <td class="name">' +
                '               <div>' + this.playersSorted[i].username + '</div>' +
                '               <div class="pointsstyle">Points: <b>' + this.playersSorted[i].score + '</b></div>' +
                '           </td>' +
                '       </tr>' +
                '   </table>' +
                '</div>';
            this.scoreboardDOM.append(string);
        }
    };
};