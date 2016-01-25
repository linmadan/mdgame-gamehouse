function GameHall() {
    this.roomID = "gameHall";
    this.gamePlayers = {};
};

GameHall.prototype.playerComingIn = function (gamePlayer) {
    this.gamePlayers[gamePlayer.playerID] = gamePlayer;
    return true;
}

GameHall.prototype.playerLeave = function (gamePlayer) {
    delete this.gamePlayers[gamePlayer.playerID];
    return true;
}


module.exports.createGameHall = function () {
    return new GameHall();
};
