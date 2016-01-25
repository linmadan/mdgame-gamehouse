var _ = require('underscore');
var dGameHall = require('./gameHall');
var dGameRoom = require('./gameRoom');

function GameHouse(houseData) {
    this.houseID = houseData.houseID;
    this.maxRoomNumber = houseData.maxRoomNumber;
    this.inHousePlayers = {};
    this.gameHall = dGameHall.createGameHall();
    this.openedGameRooms = {};
};

GameHouse.prototype.playerComingIn = function (player) {
    if (player.goTo(this.gameHall)) {
        this.inHousePlayers[player.playerID] = player;
        return true;
    }
    return false;
};

GameHouse.prototype.playerApplyForOpenNewRoom = function (player, roomData) {
    if (_.keys(this.openedGameRooms).length < this.maxRoomNumber) {
        var newGameRoom = dGameRoom.createGameRoom(roomData);
        if (player.goTo(newGameRoom)) {
            this.openedGameRooms[newGameRoom.roomID] = newGameRoom;
            return true;
        }
        return false;
    }
    return false;
};

GameHouse.prototype.playerGoToRoom = function (player, room) {
    if (_.keys(room.gamePlayers).length < room.gamePlayerAmount) {
        return player.goTo(room);
    }
    return false;
};

GameHouse.prototype.playerToBeReadyForPlayingGame = function (player) {
    if (player.readyGame()) {
        var gameRoom = player.currentLocation;
        gameRoom.isCanStartGame = true;
        if (_.keys(gameRoom.gamePlayers).length != gameRoom.gamePlayerAmount) {
            gameRoom.isCanStartGame = false;
        }
        else {
            _.each(gameRoom.gamePlayers, function (player) {
                if (!player.isReadyGame) {
                    gameRoom.isCanStartGame = false;
                }
            });
        }
        return true;
    }
    return false;
};

GameHouse.prototype.playerCancelToReadyForPlayingGame = function (player) {
    if (player.cancelReady()) {
        return true;
    }
    return false;
};

GameHouse.prototype.roomPlayersCancelReady = function (room) {
    room.isCanStartGame = false;
    _.each(room.gamePlayers, function (player) {
        if (!player.cancelReady()) {
            return false;
        }
    });
    return true;
};

GameHouse.prototype.startRoomGame = function (room) {
    return room.startGame();

};

GameHouse.prototype.endRoomGame = function (room) {
    return room.endGame();
};

GameHouse.prototype.playerLeaveRoom = function (player) {
    return player.goTo(this.gameHall);
};

GameHouse.prototype.closeRoom = function (room) {
    if (_.keys(room.gamePlayers).length === 0) {
        delete this.openedGameRooms[room.roomID];
        return true;
    }
    return false;
};

GameHouse.prototype.playerLeave = function (player) {
    delete player.currentLocation.gamePlayers[player.playerID];
    delete this.inHousePlayers[player.playerID];
    return true;
};

module.exports.createGameHouse = function (houseData) {
    return new GameHouse(houseData);
}
