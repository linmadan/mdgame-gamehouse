var util = require('util');
var EventEmitter = require('events');
var _ = require('underscore');
var appError = require('./appError');
var appUtils = require('./appUtils');
var dGameHouse = require('../domain/gameHouse');
var dGamePlayer = require('../domain/gamePlayer');

function AGameHouse() {
    EventEmitter.call(this);
    this.__gameHouse__ = null;
};
util.inherits(AGameHouse, EventEmitter);

AGameHouse.prototype.initHouse = function (houseData, cb) {
    if (this.__gameHouse__) {
        cb(new Error(appError.REPEAT_INIT_GAME_HOUSE));
        return;
    }
    var newHouseData = {};
    newHouseData.houseID = houseData.houseID;
    newHouseData.maxRoomNumber = houseData && houseData.maxRoomNumber ? houseData.maxRoomNumber : 50;
    this.__gameHouse__ = dGameHouse.createGameHouse(newHouseData);
    var cbData = {};
    cbData.houseID = this.__gameHouse__.houseID;
    cbData.maxRoomNumber = this.__gameHouse__.maxRoomNumber;
    cb(null, cbData);
};

AGameHouse.prototype.playerComingIn = function (playerData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.PLAYER_COMING_IN, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    if (this.__gameHouse__.inHousePlayers[playerData.playerID]) {
        this.emit(domainEvent.PLAYER_COMING_IN, new Error(appError.PLAYER_REPEAT_COMING_IN));
        return;
    }
    var newPlayerData = {};
    newPlayerData.playerID = playerData.playerID;
    newPlayerData.name = playerData && playerData.name ? playerData.name : playerData.playerID;
    var gamePlayer = dGamePlayer.createGamePlayer(newPlayerData);
    if (this.__gameHouse__.playerComingIn(gamePlayer)) {
        var eventData1 = {};
        eventData1.playerID = gamePlayer.playerID;
        eventData1.name = gamePlayer.name;
        this.emit(domainEvent.PLAYER_COMING_IN, null, eventData1);
        var eventData2 = {};
        eventData2.playerID = gamePlayer.playerID;
        eventData2.name = gamePlayer.name;
        eventData2.maxRoomNumber = this.__gameHouse__.maxRoomNumber;
        self = this;
        var inHousePlayers = {};
        _.each(_.keys(self.__gameHouse__.inHousePlayers), function (key) {
            inHousePlayers[key] = self.__gameHouse__.inHousePlayers[key].name;
        });
        eventData2.inHousePlayers = inHousePlayers;
        var inGameHallPlayers = {};
        _.each(_.keys(self.__gameHouse__.gameHall.gamePlayers), function (key) {
            inGameHallPlayers[key] = self.__gameHouse__.gameHall.gamePlayers[key].name;
        });
        eventData2.inGameHallPlayers = inGameHallPlayers;
        var openedGameRooms = {};
        _.each(_.keys(self.__gameHouse__.openedGameRooms), function (key) {
            var roomData = {};
            roomData.roomName = self.__gameHouse__.openedGameRooms[key].roomName;
            roomData.roomOwner = self.__gameHouse__.openedGameRooms[key].roomOwner.name;
            roomData.gameName = self.__gameHouse__.openedGameRooms[key].gameName;
            roomData.gamePlayerAmount = self.__gameHouse__.openedGameRooms[key].gamePlayerAmount;
            roomData.currentPlayerAmount = _.keys(self.__gameHouse__.openedGameRooms[key].gamePlayers).length;
            openedGameRooms[key] = roomData;
        });
        eventData2.openedGameRooms = openedGameRooms;
        this.emit(domainEvent.PLAYER_COMING_IN_HALL, null, eventData2);
    }
};

AGameHouse.prototype.playerOpenNewRoom = function (playerData, roomData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.OPEN_NEW_ROOM, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var gamePlayer = this.__gameHouse__.inHousePlayers[playerData.playerID];
    if (_.isUndefined(gamePlayer)) {
        this.emit(domainEvent.OPEN_NEW_ROOM, new Error(appError.PLAYER_NOT_IN_HOUSE));
        return;
    }
    if (_.isUndefined(this.__gameHouse__.gameHall.gamePlayers[playerData.playerID])) {
        this.emit(domainEvent.OPEN_NEW_ROOM, new Error(appError.PLAYER_NOT_IN_HALL));
        return;
    }
    var newRoomData = {};
    newRoomData.roomID = roomData && roomData.roomID ? roomData.roomID : appUtils.calculateRoomID();
    if (this.__gameHouse__.openedGameRooms[newRoomData.roomID]) {
        this.emit(domainEvent.OPEN_NEW_ROOM, new Error(appError.ROOM_IS_EXIST));
        return;
    }
    newRoomData.roomName = roomData && roomData.roomName ? roomData.roomName : "undefined";
    newRoomData.roomOwner = gamePlayer;
    newRoomData.gameName = roomData && roomData.gameName ? roomData.gameName : "ThirteenWater";
    newRoomData.gamePlayerAmount = roomData && roomData.gamePlayerAmount ? roomData.gamePlayerAmount : 4;
    if (this.__gameHouse__.playerApplyForOpenNewRoom(gamePlayer, newRoomData)) {
        var newRoom = this.__gameHouse__.openedGameRooms[newRoomData.roomID];
        var eventData = {};
        eventData.playerID = gamePlayer.playerID;
        eventData.playerName = gamePlayer.name;
        eventData.roomID = newRoom.roomID;
        eventData.roomName = newRoom.roomName;
        eventData.roomOwner = newRoom.roomOwner.name;
        eventData.gameName = newRoom.gameName;
        eventData.gamePlayerAmount = newRoom.gamePlayerAmount;
        var inRoomPlayers = {};
        _.each(_.keys(newRoom.gamePlayers), function (key) {
            var playerProperty = {};
            playerProperty.name = newRoom.gamePlayers[key].name;
            playerProperty.isReadyGame = newRoom.gamePlayers[key].isReadyGame;
            inRoomPlayers[key] = playerProperty;
        });
        var eventData2 = {};
        eventData2.playerID = gamePlayer.playerID;
        eventData2.playerName = gamePlayer.name;
        this.emit(domainEvent.PLAYER_LEAVE_HALL, null, eventData2);
        eventData.gamePlayers = inRoomPlayers;
        this.emit(domainEvent.PLAYER_COMING_IN_ROOM, null, eventData);
        eventData.currentPlayerAmount = _.keys(newRoom.gamePlayers).length;
        delete eventData.gamePlayers;
        this.emit(domainEvent.OPEN_NEW_ROOM, null, eventData);
    }
    else {
        eventData = {};
        eventData.playerID = gamePlayer.playerID;
        this.emit(domainEvent.ROOM_IS_MAX, null, eventData);
    }
};

AGameHouse.prototype.playerComingInRoom = function (playerData, roomData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.PLAYER_COMING_IN_ROOM, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var gamePlayer = this.__gameHouse__.inHousePlayers[playerData.playerID];
    if (_.isUndefined(gamePlayer)) {
        this.emit(domainEvent.PLAYER_COMING_IN_ROOM, new Error(appError.PLAYER_NOT_IN_HOUSE));
        return;
    }
    if (_.isUndefined(this.__gameHouse__.gameHall.gamePlayers[playerData.playerID])) {
        this.emit(domainEvent.PLAYER_COMING_IN_ROOM, new Error(appError.PLAYER_NOT_IN_HALL));
        return;
    }
    var room = this.__gameHouse__.openedGameRooms[roomData.roomID];
    if (_.isUndefined(room)) {
        this.emit(domainEvent.PLAYER_COMING_IN_ROOM, new Error(appError.ROOM_IS_NOT_EXIST));
        return;
    }
    if (this.__gameHouse__.playerGoToRoom(gamePlayer, room)) {
        var eventData = {};
        eventData.playerID = gamePlayer.playerID;
        eventData.playerName = gamePlayer.name;
        eventData.roomID = room.roomID;
        eventData.roomName = room.roomName;
        eventData.roomOwner = room.roomOwner.name;
        eventData.gameName = room.gameName;
        eventData.gamePlayerAmount = room.gamePlayerAmount;
        var inRoomPlayers = {};
        _.each(_.keys(room.gamePlayers), function (key) {
            var playerProperty = {};
            playerProperty.name = room.gamePlayers[key].name;
            playerProperty.isReadyGame = room.gamePlayers[key].isReadyGame;
            inRoomPlayers[key] = playerProperty;
        });
        var eventData2 = {};
        eventData2.playerID = gamePlayer.playerID;
        eventData2.playerName = gamePlayer.name;
        this.emit(domainEvent.PLAYER_LEAVE_HALL, null, eventData2);
        eventData.gamePlayers = inRoomPlayers;
        this.emit(domainEvent.PLAYER_COMING_IN_ROOM, null, eventData);
    }
    else {
        eventData = {};
        eventData.playerID = gamePlayer.playerID;
        eventData.playerName = gamePlayer.name;
        eventData.roomID = room.roomID;
        eventData.roomName = room.roomName;
        eventData.gamePlayerAmount = room.gamePlayerAmount;
        this.emit(domainEvent.PLAYER_IS_MAX, null, eventData);
    }
};

AGameHouse.prototype.playerReadyGame = function (playerData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.PLAYER_READY_TO_PLAY_GAME, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var gamePlayer = this.__gameHouse__.inHousePlayers[playerData.playerID];
    if (_.isUndefined(gamePlayer)) {
        this.emit(domainEvent.PLAYER_READY_TO_PLAY_GAME, new Error(appError.PLAYER_NOT_IN_HOUSE));
        return;
    }
    var room = gamePlayer.currentLocation;
    if (_.isUndefined(room) || room == this.__gameHouse__.gameHall) {
        this.emit(domainEvent.PLAYER_READY_TO_PLAY_GAME, new Error(appError.PLAYER_NOT_IN_THIS_ROOM));
        return;
    }
    if (room.isGaming) {
        this.emit(domainEvent.PLAYER_READY_TO_PLAY_GAME, new Error(appError.GAME_ALREADY_START));
        return;
    }
    if (room.isCanStartGame) {
        this.emit(domainEvent.PLAYER_READY_TO_PLAY_GAME, new Error(appError.PLAYER_ALREADY_READY_GAME));
        return;
    }
    if (gamePlayer.isReadyGame) {
        this.emit(domainEvent.PLAYER_READY_TO_PLAY_GAME, new Error(appError.PLAYER_ALREADY_READY_GAME));
        return;
    }
    if (this.__gameHouse__.playerToBeReadyForPlayingGame(gamePlayer)) {
        var eventData = {};
        eventData.playerID = gamePlayer.playerID;
        eventData.playerName = gamePlayer.name;
        eventData.roomID = room.roomID;
        this.emit(domainEvent.PLAYER_READY_TO_PLAY_GAME, null, eventData);
        if (room.isCanStartGame) {
            eventData = {};
            eventData.roomID = room.roomID;
            eventData.gameName = room.gameName;
            eventData.players = [];
            _.each(_.keys(room.gamePlayers), function (key) {
                var player = {};
                player.playerID = room.gamePlayers[key].playerID;
                player.playerName = room.gamePlayers[key].name;
                eventData.players.push(player);
            });
            this.emit(domainEvent.CAN_START_GAME, null, eventData);
        }
    }
};

AGameHouse.prototype.playerCancelReady = function (playerData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.PLAYER_CANCEL_READY, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var gamePlayer = this.__gameHouse__.inHousePlayers[playerData.playerID];
    if (_.isUndefined(gamePlayer)) {
        this.emit(domainEvent.PLAYER_CANCEL_READY, new Error(appError.PLAYER_NOT_IN_HOUSE));
        return;
    }
    var room = gamePlayer.currentLocation;
    if (_.isUndefined(room) || room == this.__gameHouse__.gameHall) {
        this.emit(domainEvent.PLAYER_CANCEL_READY, new Error(appError.PLAYER_NOT_IN_THIS_ROOM));
        return;
    }
    if (room.isGaming) {
        this.emit(domainEvent.PLAYER_CANCEL_READY, new Error(appError.GAME_ALREADY_START));
        return;
    }
    if (room.isCanStartGame) {
        this.emit(domainEvent.PLAYER_CANCEL_READY, new Error(appError.GAME_ALREADY_START));
        return;
    }
    if (!gamePlayer.isReadyGame) {
        this.emit(domainEvent.PLAYER_CANCEL_READY, new Error(appError.PLAYERS_NOT_READY_GAME));
        return;
    }
    if (this.__gameHouse__.playerCancelToReadyForPlayingGame(gamePlayer)) {
        var eventData = {};
        eventData.playerID = gamePlayer.playerID;
        eventData.playerName = gamePlayer.name;
        eventData.roomID = room.roomID;
        this.emit(domainEvent.PLAYER_CANCEL_READY, null, eventData);
    }
};

AGameHouse.prototype.roomPlayersCancelReady = function (roomData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.ROOM_PLAYERS_CANCEL_READY, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var room = this.__gameHouse__.openedGameRooms[roomData.roomID];
    if (_.isUndefined(room)) {
        this.emit(domainEvent.ROOM_PLAYERS_CANCEL_READY, new Error(appError.ROOM_IS_NOT_EXIST));
        return;
    }
    if (room.isGaming) {
        this.emit(domainEvent.ROOM_PLAYERS_CANCEL_READY, new Error(appError.GAME_ALREADY_START));
        return;
    }
    if (this.__gameHouse__.roomPlayersCancelReady(room)) {
        var eventData = {};
        eventData.roomID = room.roomID;
        var inRoomPlayers = {};
        _.each(_.keys(room.gamePlayers), function (key) {
            var playerProperty = {};
            playerProperty.name = room.gamePlayers[key].name;
            playerProperty.isReadyGame = room.gamePlayers[key].isReadyGame;
            inRoomPlayers[key] = playerProperty;
        });
        eventData.gamePlayers = inRoomPlayers;
        this.emit(domainEvent.ROOM_PLAYERS_CANCEL_READY, null, eventData);
    }
};

AGameHouse.prototype.roomStartGame = function (roomData, gameData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.GAME_START, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var room = this.__gameHouse__.openedGameRooms[roomData.roomID];
    if (_.isUndefined(room)) {
        this.emit(domainEvent.GAME_START, new Error(appError.ROOM_IS_NOT_EXIST));
        return;
    }
    if (!room.isCanStartGame) {
        this.emit(domainEvent.GAME_START, new Error(appError.PLAYERS_NOT_ALL_READY_GAME));
        return;
    }
    if (room.isGaming) {
        this.emit(domainEvent.GAME_START, new Error(appError.GAME_ALREADY_START));
        return;
    }
    if (_.isNull(gameData)) {
        this.emit(domainEvent.GAME_START, new Error(appError.GAME_NOT_INIT));
        return;
    }
    if (this.__gameHouse__.startRoomGame(room)) {
        var eventData = {};
        eventData.roomID = room.roomID;
        eventData.gameData = gameData;
        this.emit(domainEvent.GAME_START, null, eventData);
    }
};

AGameHouse.prototype.roomEndGame = function (roomData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.GAME_END, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var room = this.__gameHouse__.openedGameRooms[roomData.roomID];
    if (_.isUndefined(room)) {
        this.emit(domainEvent.GAME_END, new Error(appError.ROOM_IS_NOT_EXIST));
        return;
    }
    if (!room.isGaming) {
        this.emit(domainEvent.GAME_END, new Error(appError.GAME_NOT_START));
        return;
    }
    if (this.__gameHouse__.endRoomGame(room)) {
        var eventData = {};
        eventData.roomID = room.roomID;
        eventData.roomName = room.roomName;
        eventData.gameName = room.gameName;
        eventData.roomOwner = room.roomOwner.name;
        eventData.gamePlayerAmount = room.gamePlayerAmount;
        var inRoomPlayers = {};
        _.each(_.keys(room.gamePlayers), function (key) {
            var playerProperty = {};
            playerProperty.name = room.gamePlayers[key].name;
            playerProperty.isReadyGame = room.gamePlayers[key].isReadyGame;
            inRoomPlayers[key] = playerProperty;
        });
        eventData.gamePlayers = inRoomPlayers;
        this.emit(domainEvent.GAME_END, null, eventData);
    }
};

AGameHouse.prototype.playerLeaveRoom = function (playerData, roomData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.PLAYER_LEAVE_ROOM, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var room = this.__gameHouse__.openedGameRooms[roomData.roomID];
    if (_.isUndefined(room)) {
        this.emit(domainEvent.PLAYER_LEAVE_ROOM, new Error(appError.ROOM_IS_NOT_EXIST));
        return;
    }
    var gamePlayer = room.gamePlayers[playerData.playerID];
    if (_.isUndefined(gamePlayer)) {
        this.emit(domainEvent.PLAYER_LEAVE_ROOM, new Error(appError.PLAYER_NOT_IN_THIS_ROOM));
        return;
    }
    if (room.isGaming && (!gamePlayer.isRunAwayer)) {
        this.emit(domainEvent.PLAYER_LEAVE_ROOM, new Error(appError.GAME_ALREADY_START));
        return;
    }
    if (this.__gameHouse__.playerLeaveRoom(gamePlayer)) {
        var eventData = {};
        eventData.playerID = gamePlayer.playerID;
        eventData.playerName = gamePlayer.name;
        eventData.roomID = room.roomID;
        eventData.roomName = room.roomName;
        eventData.roomOwner = room.roomOwner.name;
        eventData.gamePlayerAmount = room.gamePlayerAmount;
        eventData.currentPlayerAmount = _.keys(room.gamePlayers).length;
        this.emit(domainEvent.PLAYER_LEAVE_ROOM, null, eventData);
        if (this.__gameHouse__.closeRoom(room)) {
            eventData = {};
            eventData.roomID = room.roomID;
            eventData.roomName = room.roomName;
            this.emit(domainEvent.CLOSE_A_ROOM, null, eventData);
        }
        var eventData2 = {};
        eventData2.playerID = gamePlayer.playerID;
        eventData2.name = gamePlayer.name;
        eventData2.maxRoomNumber = this.__gameHouse__.maxRoomNumber;
        self = this;
        var inHousePlayers = {};
        _.each(_.keys(self.__gameHouse__.inHousePlayers), function (key) {
            inHousePlayers[key] = self.__gameHouse__.inHousePlayers[key].name;
        });
        eventData2.inHousePlayers = inHousePlayers;
        var inGameHallPlayers = {};
        _.each(_.keys(self.__gameHouse__.gameHall.gamePlayers), function (key) {
            inGameHallPlayers[key] = self.__gameHouse__.gameHall.gamePlayers[key].name;
        });
        eventData2.inGameHallPlayers = inGameHallPlayers;
        var openedGameRooms = {};
        _.each(_.keys(self.__gameHouse__.openedGameRooms), function (key) {
            var roomData = {};
            roomData.roomName = self.__gameHouse__.openedGameRooms[key].roomName;
            roomData.roomOwner = self.__gameHouse__.openedGameRooms[key].roomOwner.name;
            roomData.gameName = self.__gameHouse__.openedGameRooms[key].gameName;
            roomData.gamePlayerAmount = self.__gameHouse__.openedGameRooms[key].gamePlayerAmount;
            roomData.currentPlayerAmount = _.keys(self.__gameHouse__.openedGameRooms[key].gamePlayers).length;
            openedGameRooms[key] = roomData;
        });
        eventData2.openedGameRooms = openedGameRooms;
        this.emit(domainEvent.PLAYER_COMING_IN_HALL, null, eventData2);
    }
};

AGameHouse.prototype.playerLeave = function (playerData) {
    if (_.isNull(this.__gameHouse__)) {
        this.emit(domainEvent.PLAYER_LEAVE, new Error(appError.NOT_INIT_GAME_HOUSE));
        return;
    }
    var player = this.__gameHouse__.inHousePlayers[playerData.playerID];
    if (_.isUndefined(player)) {
        this.emit(domainEvent.PLAYER_LEAVE, new Error(appError.PLAYER_NOT_IN_HOUSE));
        return;
    }
    var eventData = {};
    eventData.playerID = player.playerID;
    eventData.playerName = player.name;
    if (player.currentLocation.roomID != "gameHall") {
        var room = player.currentLocation;
        if (room.isGaming || room.isCanStartGame) {
            eventData.roomID = room.roomID;
            eventData.gameName = room.gameName;
            player.isRunAwayer = true;
            this.emit(domainEvent.PLAYER_RUN_AWAY, null, eventData);
        }
        var roomData = {};
        roomData.roomID = room.roomID;
        this.playerLeaveRoom(playerData, roomData);
    }
    this.__gameHouse__.playerLeave(player);
    delete eventData.roomID;
    delete eventData.gameName;
    this.emit(domainEvent.PLAYER_LEAVE, null, eventData);
};

var domainEvent = {
    PLAYER_COMING_IN: "player-coming-in",
    OPEN_NEW_ROOM: "open-new-room",
    CLOSE_A_ROOM: "close-a-room",
    ROOM_IS_MAX: "room-is-max",
    PLAYER_COMING_IN_HALL: "player-coming-in-hall",
    PLAYER_LEAVE_HALL: "player-leave-hall",
    PLAYER_COMING_IN_ROOM: "player-coming-in-room",
    PLAYER_IS_MAX: "player-is-max",
    PLAYER_LEAVE_ROOM: "player-leave-room",
    PLAYER_READY_TO_PLAY_GAME: "player-ready-to-play-game",
    PLAYER_CANCEL_READY: "player-cancel-ready",
    ROOM_PLAYERS_CANCEL_READY: "room-players-cancel-ready",
    CAN_START_GAME: "can-start-game",
    GAME_START: "game-start",
    GAME_END: "game-end",
    PLAYER_LEAVE: "player-leave",
    PLAYER_RUN_AWAY: "player-run-away"
};

module.exports.createAGameHouse = function () {
    return new AGameHouse();
};
module.exports.domainEvent = domainEvent
