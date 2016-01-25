var should = require('should');
var gameHouse = require('../../lib/application/gameHouse');
var appError = require('../../lib/application/appError');

describe('AGameHouse use case test', function () {
    var aGameHouse;
    before(function () {
        aGameHouse = gameHouse.createAGameHouse();
    });
    context('to init a new game house #initHouse(houseData,cb)', function () {
        it('should set input game house data for new game house', function (done) {
            var houseData = {};
            houseData.houseID = "house-1";
            houseData.maxRoomNumber = 1;
            aGameHouse.initHouse(houseData, function (err, cbData) {
                cbData.houseID.should.be.eql("house-1");
                cbData.maxRoomNumber.should.be.eql(1);
                done();
            });
        });
        it('should error if init game house one more time', function (done) {
            var houseData = {};
            houseData.houseID = "house-2";
            aGameHouse.initHouse(houseData, function (err) {
                err.message.should.be.eql(appError.REPEAT_INIT_GAME_HOUSE);
                done();
            });
        });
    });
    context('house has init,then a game player go into game house #playerComingIn(playerData)', function () {
        it('should emit "PLAYER_COMING_IN" event and emit "PLAYER_COMING_IN_HALL" event', function (done) {
            var currentEmitCount = 0;
            var emitDone = function () {
                currentEmitCount++;
                if (currentEmitCount == 2) {
                    done();
                }
            };
            aGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN, function (err, eventData) {
                eventData.playerID.should.be.eql("linmadan");
                eventData.name.should.be.eql("linmadan");
                emitDone();
            });
            aGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_HALL, function (err, eventData) {
                eventData.maxRoomNumber.should.be.eql(1);
                eventData.inHousePlayers.should.be.eql({linmadan: "linmadan"});
                eventData.inGameHallPlayers.should.eql({linmadan: "linmadan"});
                eventData.openedGameRooms.should.eql({});
                eventData.playerID.should.be.eql("linmadan");
                eventData.name.should.be.eql("linmadan");
                emitDone();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            playerData.name = "linmadan";
            aGameHouse.playerComingIn(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_COMING_IN);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_COMING_IN_HALL);

        });
        it('should error if player has in the game house', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN, function (err) {
                err.message.should.be.eql(appError.PLAYER_REPEAT_COMING_IN);
                done();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            playerData.name = "linmadan";
            aGameHouse.playerComingIn(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_COMING_IN);
        });
    });
    context('when a game player open a new room #playerOpenNewRoom(playerData, roomData)', function () {
        it('should error if player is not in game house', function (done) {
            aGameHouse.on(gameHouse.domainEvent.OPEN_NEW_ROOM, function (err) {
                err.message.should.be.eql(appError.PLAYER_NOT_IN_HOUSE);
                done();
            });
            var playerData = {};
            playerData.playerID = "uerltd";
            var roomData = {};
            aGameHouse.playerOpenNewRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.OPEN_NEW_ROOM);
        });
        it('should emit "OPEN_NEW_ROOM" event set input room data for new room,' +
            'and should emit "PLAYER_COMING_IN_ROOM" event' +
            'and should emit "PLAYER_LEAVE_HALL" event', function (done) {
            var currentEmitCount = 0;
            var emitDone = function () {
                currentEmitCount++;
                if (currentEmitCount == 3) {
                    done();
                }
            };
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE_HALL, function (err, eventData) {
                eventData.playerID.should.be.eql("linmadan");
                eventData.playerName.should.be.eql("linmadan");
                emitDone();
            });
            aGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM, function (err, eventData) {
                eventData.playerID.should.be.eql("linmadan");
                eventData.playerName.should.be.eql("linmadan");
                eventData.roomID.should.be.eql("room-1");
                eventData.roomName.should.be.eql("my room");
                eventData.roomOwner.should.be.eql("linmadan");
                eventData.gameName.should.be.eql("50k");
                eventData.gamePlayerAmount.should.be.eql(2);
                eventData.gamePlayers.should.eql({linmadan: {name: "linmadan", isReadyGame: false}});
                emitDone();
            });
            aGameHouse.on(gameHouse.domainEvent.OPEN_NEW_ROOM, function (err, eventData) {
                eventData.playerID.should.be.eql("linmadan");
                eventData.playerName.should.be.eql("linmadan");
                eventData.roomID.should.be.eql("room-1");
                eventData.roomName.should.be.eql("my room");
                eventData.roomOwner.should.be.eql("linmadan");
                eventData.gameName.should.be.eql("50k");
                eventData.gamePlayerAmount.should.be.eql(2);
                eventData.currentPlayerAmount.should.be.eql(1);
                emitDone();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            playerData.name = "linmadan";
            var roomData = {};
            roomData.roomID = "room-1";
            roomData.roomName = "my room";
            roomData.gameName = "50k";
            roomData.gamePlayerAmount = 2;
            aGameHouse.playerOpenNewRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.OPEN_NEW_ROOM);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE_HALL);
        });
        it('should error if player is not in game hall when open a new room', function (done) {
            aGameHouse.on(gameHouse.domainEvent.OPEN_NEW_ROOM, function (err) {
                err.message.should.be.eql(appError.PLAYER_NOT_IN_HALL);
                done();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            var roomData = {};
            aGameHouse.playerOpenNewRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.OPEN_NEW_ROOM);
        });
        it('should emit "ROOM_IS_MAX" event when opened room number is max', function (done) {
            var playerData = {};
            playerData.playerID = "huhuzhu";
            aGameHouse.playerComingIn(playerData);
            var roomData = {};
            aGameHouse.on(gameHouse.domainEvent.ROOM_IS_MAX, function (err, eventData) {
                eventData.playerID.should.equal("huhuzhu");
                done();
            });
            aGameHouse.playerOpenNewRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.ROOM_IS_MAX);
        });
    });
    context('when a game player coming in a room #playerComingInRoom(playerData, roomData)', function () {
        it('should error if player is not in game house', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM, function (err) {
                err.message.should.be.eql(appError.PLAYER_NOT_IN_HOUSE);
                done();
            });
            var playerData = {};
            playerData.playerID = "uerltd";
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.playerComingInRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM);
        });
        it('should emit "PLAYER_COMING_IN_ROOM" event and should emit "PLAYER_LEAVE_HALL" event', function (done) {
            var currentEmitCount = 0;
            var emitDone = function () {
                currentEmitCount++;
                if (currentEmitCount == 2) {
                    done();
                }
            };
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE_HALL, function (err, eventData) {
                eventData.playerID.should.be.eql("huhuzhu");
                eventData.playerName.should.be.eql("huhuzhu");
                emitDone();
            });
            aGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM, function (err, eventData) {
                eventData.playerID.should.be.eql("huhuzhu");
                eventData.playerName.should.be.eql("huhuzhu");
                eventData.roomID.should.be.eql("room-1");
                eventData.roomName.should.be.eql("my room");
                eventData.roomOwner.should.be.eql("linmadan");
                eventData.gameName.should.be.eql("50k");
                eventData.gamePlayerAmount.should.be.eql(2);
                eventData.gamePlayers.should.eql({
                    linmadan: {name: "linmadan", isReadyGame: false},
                    huhuzhu: {name: "huhuzhu", isReadyGame: false}
                });
                emitDone();
            });
            var playerData = {};
            playerData.playerID = "huhuzhu";
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.playerComingInRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE_HALL);
        });
        it('should error if player is coming in a room not in game hall', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM, function (err) {
                err.message.should.be.eql(appError.PLAYER_NOT_IN_HALL);
                done();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.playerComingInRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_COMING_IN_ROOM);
        });
        it('should emit "PLAYER_IS_MAX" event when room player amount is max', function (done) {
            var playerData = {};
            playerData.playerID = "uerltd";
            aGameHouse.playerComingIn(playerData);
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.on(gameHouse.domainEvent.PLAYER_IS_MAX, function (err, eventData) {
                eventData.playerID.should.equal("uerltd");
                eventData.roomID.should.equal("room-1");
                done();
            });
            aGameHouse.playerComingInRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_IS_MAX);
        });
    });
    context('when a game player to be ready for playing game #playerReadyGame(playerData)', function () {
        it('should error if player is not in a room', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_READY_TO_PLAY_GAME, function (err) {
                err.message.should.be.eql(appError.PLAYER_NOT_IN_THIS_ROOM);
                done();
            });
            var playerData = {};
            playerData.playerID = "uerltd";
            aGameHouse.playerReadyGame(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_READY_TO_PLAY_GAME);
        });
        it('should emit "PLAYER_READY_TO_PLAY_GAME" event', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_READY_TO_PLAY_GAME, function (err, eventData) {
                eventData.playerID.should.be.eql("huhuzhu");
                eventData.playerName.should.be.eql("huhuzhu");
                eventData.roomID.should.be.eql("room-1");
                done();
            });
            var playerData = {};
            playerData.playerID = "huhuzhu";
            aGameHouse.playerReadyGame(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_READY_TO_PLAY_GAME);
        });
        it('should emit "CAN_START_GAME" event when this game "gamePlayerAmount" players is all ready', function (done) {
            aGameHouse.on(gameHouse.domainEvent.CAN_START_GAME, function (err, eventData) {
                eventData.roomID.should.be.eql("room-1");
                eventData.gameName.should.be.eql("50k");
                eventData.players.should.eql([{playerID: "linmadan", playerName: "linmadan"}, {
                    playerID: "huhuzhu",
                    playerName: "huhuzhu"
                }]);
                done();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            aGameHouse.playerReadyGame(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.CAN_START_GAME);
        });
    });
    context('when a room players cancel ready game #roomPlayersCancelReady(roomData)', function () {
        it('should emit "ROOM_PLAYERS_CANCEL_READY" event', function (done) {
            aGameHouse.on(gameHouse.domainEvent.ROOM_PLAYERS_CANCEL_READY, function (err, eventData) {
                eventData.roomID.should.be.eql("room-1");
                eventData.gamePlayers.should.eql({
                    linmadan: {name: "linmadan", isReadyGame: false},
                    huhuzhu: {name: "huhuzhu", isReadyGame: false}
                });
                done();
            });
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.roomPlayersCancelReady(roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.ROOM_PLAYERS_CANCEL_READY);
        });
    });
    context('when a player cancel ready game #playerCancelReady(playerData)', function () {
        it('should error if player is not in a room', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_CANCEL_READY, function (err) {
                err.message.should.be.eql(appError.PLAYER_NOT_IN_THIS_ROOM);
                done();
            });
            var playerData = {};
            playerData.playerID = "uerltd";
            aGameHouse.playerCancelReady(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_CANCEL_READY);
        });
        it('should error if player is not ready to game', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_CANCEL_READY, function (err) {
                err.message.should.be.eql(appError.PLAYERS_NOT_READY_GAME);
                done();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            aGameHouse.playerCancelReady(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_CANCEL_READY);
        });
        it('should emit "PLAYER_CANCEL_READY" event', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_CANCEL_READY, function (err, eventData) {
                eventData.playerID.should.be.eql("linmadan");
                eventData.playerName.should.be.eql("linmadan");
                eventData.roomID.should.be.eql("room-1");
                done();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            aGameHouse.playerReadyGame(playerData);
            aGameHouse.playerCancelReady(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_CANCEL_READY);
        });
        it('should error if is can start a game or have start a game in a room', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_CANCEL_READY, function (err) {
                err.message.should.be.eql(appError.GAME_ALREADY_START);
                done();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            aGameHouse.playerReadyGame(playerData);
            playerData = {};
            playerData.playerID = "huhuzhu";
            aGameHouse.playerReadyGame(playerData);
            aGameHouse.playerCancelReady(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_CANCEL_READY);
        });
    });
    context('when room is start game #roomStartGame(roomData, gameData)', function () {
        it('should error if that have player not ready game', function (done) {
            aGameHouse.on(gameHouse.domainEvent.GAME_START, function (err) {
                err.message.should.be.eql(appError.PLAYERS_NOT_ALL_READY_GAME);
                done();
            });
            var roomData = {};
            roomData.roomID = "room-1";
            var gameData = null;
            aGameHouse.roomPlayersCancelReady(roomData);
            aGameHouse.roomStartGame(roomData, gameData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.GAME_START);
        });
        it('when player all ready should error if that gameData is null', function (done) {
            aGameHouse.on(gameHouse.domainEvent.GAME_START, function (err) {
                err.message.should.be.eql(appError.GAME_NOT_INIT);
                done();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            aGameHouse.playerReadyGame(playerData);
            playerData = {};
            playerData.playerID = "huhuzhu";
            aGameHouse.playerReadyGame(playerData);
            var roomData = {};
            roomData.roomID = "room-1";
            var gameData = null;
            aGameHouse.roomStartGame(roomData, gameData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.GAME_START);
        });
        it('should emit "GAME_START" event', function (done) {
            aGameHouse.on(gameHouse.domainEvent.GAME_START, function (err, eventData) {
                eventData.roomID.should.be.eql("room-1");
                eventData.gameData.should.be.eql({});
                done();
            });
            var roomData = {};
            roomData.roomID = "room-1";
            var gameData = {};
            aGameHouse.roomStartGame(roomData, gameData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.GAME_START);
        });
    });
    context('when a game is end in a room #roomEndGame(roomData)', function () {
        it('should emit "GAME_END" event', function (done) {
            aGameHouse.on(gameHouse.domainEvent.GAME_END, function (err, eventData) {
                eventData.roomID.should.be.eql("room-1");
                eventData.roomName.should.be.eql("my room");
                eventData.roomOwner.should.be.eql("linmadan");
                eventData.gameName.should.be.eql("50k");
                eventData.gamePlayerAmount.should.be.eql(2);
                eventData.gamePlayers.should.eql({
                    linmadan: {name: "linmadan", isReadyGame: false},
                    huhuzhu: {name: "huhuzhu", isReadyGame: false}
                });
                done();
            });
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.roomEndGame(roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.GAME_END);
        });
    });
    context('when a game player leave a room #playerLeaveRoom(playerData, roomData)', function () {
        it('should error if player is not in this room', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE_ROOM, function (err) {
                err.message.should.be.eql(appError.PLAYER_NOT_IN_THIS_ROOM);
                done();
            });
            var playerData = {};
            playerData.playerID = "uerltd";
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.playerLeaveRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE_ROOM);
        });
        it('should emit "PLAYER_LEAVE_ROOM" event and should emit "PLAYER_COMING_IN_HALL" event', function (done) {
            var currentEmitCount = 0;
            var emitDone = function () {
                currentEmitCount++;
                if (currentEmitCount == 2) {
                    done();
                }
            };
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE_ROOM, function (err, eventData) {
                eventData.playerID.should.be.eql("linmadan");
                eventData.playerName.should.be.eql("linmadan");
                eventData.roomID.should.be.eql("room-1");
                eventData.roomName.should.be.eql("my room");
                eventData.roomOwner.should.be.eql("huhuzhu");
                eventData.gamePlayerAmount.should.be.eql(2);
                eventData.currentPlayerAmount.should.be.eql(1);
                emitDone();
            });
            aGameHouse.on(gameHouse.domainEvent.PLAYER_COMING_IN_HALL, function (err, eventData) {
                eventData.maxRoomNumber.should.be.eql(1);
                eventData.inHousePlayers.should.be.eql({linmadan: "linmadan", huhuzhu: "huhuzhu", uerltd: "uerltd"});
                eventData.inGameHallPlayers.should.be.eql({linmadan: "linmadan", uerltd: "uerltd"});
                eventData.openedGameRooms.should.be.eql({
                    "room-1": {
                        "roomName": "my room",
                        "roomOwner": "huhuzhu",
                        "gameName": "50k",
                        "gamePlayerAmount": 2,
                        "currentPlayerAmount": 1
                    }
                });
                eventData.playerID.should.be.eql("linmadan");
                eventData.name.should.be.eql("linmadan");
                emitDone();
            });
            var playerData = {};
            playerData.playerID = "linmadan";
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.playerLeaveRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE_ROOM);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_COMING_IN_HALL);
        });
        it('should emit "CLOSE_A_ROOM" event when all in the room players is leave', function (done) {
            aGameHouse.on(gameHouse.domainEvent.CLOSE_A_ROOM, function (err, eventData) {
                eventData.roomID.should.be.eql("room-1");
                eventData.roomName.should.be.eql("my room");
                done();
            });
            var playerData = {};
            playerData.playerID = "huhuzhu";
            var roomData = {};
            roomData.roomID = "room-1";
            aGameHouse.playerLeaveRoom(playerData, roomData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.CLOSE_A_ROOM);
        });
    });
    context('a game player leave game house #playerLeave(playerData)', function () {
        it('should error if player has not in the game house', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE, function (err) {
                err.message.should.be.eql(appError.PLAYER_NOT_IN_HOUSE);
                done();
            });
            var playerData = {};
            playerData.playerID = "noplayer";
            playerData.name = "noplayer";
            aGameHouse.playerLeave(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE);
        });
        it('should emit "PLAYER_LEAVE" event if player in the game hall', function (done) {
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE, function (err, eventData) {
                eventData.playerID.should.be.eql("player1");
                eventData.playerName.should.be.eql("player1");
                done();
            });
            var playerData = {};
            playerData.playerID = "player1";
            playerData.name = "player1";
            aGameHouse.playerComingIn(playerData);
            aGameHouse.playerLeave(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE);
        });
        it('should emit "PLAYER_LEAVE_ROOM" and "PLAYER_LEAVE" event if player in the room and not start game', function (done) {
            var currentEmitCount = 0;
            var emitDone = function () {
                currentEmitCount++;
                if (currentEmitCount == 2) {
                    done();
                }
            };
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE_ROOM, function (err, eventData) {
                eventData.playerID.should.be.eql("player2");
                eventData.playerName.should.be.eql("player2");
                eventData.roomID.should.be.eql("room-2");
                eventData.roomName.should.be.eql("my room");
                eventData.roomOwner.should.be.eql("player2");
                eventData.gamePlayerAmount.should.be.eql(2);
                eventData.currentPlayerAmount.should.be.eql(0);
                emitDone();
            });
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE, function (err, eventData) {
                eventData.playerID.should.be.eql("player2");
                eventData.playerName.should.be.eql("player2");
                emitDone();
            });
            var playerData = {};
            playerData.playerID = "player2";
            playerData.name = "player2";
            aGameHouse.playerComingIn(playerData);
            var roomData = {};
            roomData.roomID = "room-2";
            roomData.roomName = "my room";
            roomData.gameName = "50k";
            roomData.gamePlayerAmount = 2;
            aGameHouse.playerOpenNewRoom(playerData, roomData);
            aGameHouse.playerLeave(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE_ROOM);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE);
        });
        it('should emit "PLAYER_RUN_AWAY","PLAYER_LEAVE_ROOM" ,"PLAYER_LEAVE" event if player in the room and start game', function (done) {
            var currentEmitCount = 0;
            var emitDone = function () {
                currentEmitCount++;
                if (currentEmitCount == 3) {
                    done();
                }
            };
            aGameHouse.on(gameHouse.domainEvent.PLAYER_RUN_AWAY, function (err, eventData) {
                eventData.roomID.should.be.eql("room-2");
                eventData.gameName.should.be.eql("50k");
                eventData.playerID.should.be.eql("player3");
                eventData.playerName.should.be.eql("player3");
                emitDone();
            });
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE_ROOM, function (err, eventData) {
                eventData.playerID.should.be.eql("player3");
                eventData.playerName.should.be.eql("player3");
                eventData.roomID.should.be.eql("room-2");
                eventData.roomName.should.be.eql("my room");
                eventData.roomOwner.should.be.eql("huhuzhu");
                eventData.gamePlayerAmount.should.be.eql(2);
                eventData.currentPlayerAmount.should.be.eql(1);
                emitDone();
            });
            aGameHouse.on(gameHouse.domainEvent.PLAYER_LEAVE, function (err, eventData) {
                eventData.playerID.should.be.eql("player3");
                eventData.playerName.should.be.eql("player3");
                emitDone();
            });
            var playerData = {};
            playerData.playerID = "huhuzhu";
            playerData.name = "huhuzhu";
            aGameHouse.playerComingIn(playerData);
            var roomData = {};
            roomData.roomID = "room-2";
            roomData.roomName = "my room";
            roomData.gameName = "50k";
            roomData.gamePlayerAmount = 2;
            aGameHouse.playerOpenNewRoom(playerData, roomData);
            aGameHouse.playerReadyGame(playerData);
            playerData.playerID = "player3";
            playerData.name = "player3";
            aGameHouse.playerComingIn(playerData);
            aGameHouse.playerComingInRoom(playerData, roomData);
            aGameHouse.playerReadyGame(playerData);
            aGameHouse.roomStartGame(roomData, {});
            aGameHouse.playerLeave(playerData);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_RUN_AWAY);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE_ROOM);
            aGameHouse.removeAllListeners(gameHouse.domainEvent.PLAYER_LEAVE);
        });
    });
});