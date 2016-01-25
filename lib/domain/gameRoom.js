var _ = require('underscore');

function GameRoom(roomData) {
    this.roomID = roomData.roomID;
    this.roomName = roomData.roomName;
    this.roomOwner = roomData.roomOwner;
    this.gameName = roomData.gameName;
    this.gamePlayerAmount = roomData.gamePlayerAmount;
    this.gamePlayers = {};
    this.isCanStartGame = false;
    this.isGaming = false;
};

GameRoom.prototype.playerComingIn = function (gamePlayer) {
    if (_.keys(this.gamePlayers).length >= this.gamePlayerAmount) {
        return false;
    }
    this.gamePlayers[gamePlayer.playerID] = gamePlayer;
    return true;
};

GameRoom.prototype.playerLeave = function (gamePlayer) {
    delete this.gamePlayers[gamePlayer.playerID];
    if (gamePlayer.playerID == this.roomOwner.playerID) {
        if (_.keys(this.gamePlayers).length > 0) {
            this.roomOwner = _.values(this.gamePlayers)[0];
        }
    }
    return true;
};

GameRoom.prototype.startGame = function () {
    this.isGaming = true;
    return true;
};

GameRoom.prototype.endGame = function () {
    this.isCanStartGame = false;
    this.isGaming = false;
    _.each(this.gamePlayers, function (player) {
        player.isReadyGame = false;
    });
    return true;
};

module.exports.createGameRoom = function (roomData) {
    return new GameRoom(roomData);
};
