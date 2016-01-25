module.exports.calculateRoomID = function () {
    var currentDate = new Date();
    return "room" + currentDate.getTime().toString();
}
