var _ = require('underscore');

function GamePlayer(playerData) {
    this.playerID = playerData.playerID;
    this.name = playerData.name;
    this.currentLocation = null;
    this.isReadyGame = false;
    this.isRunAwayer = false;
};

GamePlayer.prototype.goTo = function (location) {
    if(this.currentLocation)
    {
        if(!this.currentLocation.playerLeave(this)){
            return false;
        }
    }
    if(location.playerComingIn(this)){
        this.currentLocation = location;
        return true;
    }
    return false;
};

GamePlayer.prototype.readyGame = function () {
    this.isReadyGame = true;
    return true;
};

GamePlayer.prototype.cancelReady = function () {
    this.isReadyGame = false;
    return true;
};

module.exports.createGamePlayer = function (playerData) {
    return new GamePlayer(playerData);
};
