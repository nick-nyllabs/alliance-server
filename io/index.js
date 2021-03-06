'use strict';
var socketio = require('socket.io');
var io = null;
var events = require('events');
var chalk = require('chalk');
var eventEmitter = new events.EventEmitter();
var assignRoles = require('./gameStart');

var Room = require('mongoose').model('Room');

eventEmitter.on("test", function(){
  console.log("TEST WORKED");
});

module.exports = function (server) {

  if (io) return io;

  io = socketio(server);

  io.on('connection', function (socket) {

    socket.on('join-room', function (room) {
      console.log("request to join room ", room);
      if(typeof room !== 'string') {
        console.log('need to join a room by string. returnin');
        return;
      }
      socket.join(room);
      io.sockets.to(room).emit('test', "THIS IS THE ROOOM");
    });

    socket.on('send-test', function () {
      console.log("test reciewen");
      socket.emit('test', 'this is a test');
    });
    socket.on('test-room', function(room){
      console.log("test recieved??? in room??", room);
      io.sockets.in(room).emit('message', 'this went to room ' + room);
    });

    //// all sockets should have the roomId as the first arg so that it will only be broadcasted to that room
    //// rooms _id used for each room.

    socket.on("update-players", function (room, players) {
      console.log("got update players, emittin ", players);
      io.sockets.in(room).emit("update-players", players);
      io.sockets.in("ROOM_SELECTION").emit("update-players", room, players);
    });

    socket.on("remove-player", function (room, playerId) {
      console.log("triggered ", room, playerId);
      io.sockets.in(room).emit("remove-player", playerId);
    });

    socket.on("update-room", function (room, roomObj) {
      io.sockets.in(room).emit("update-room", roomObj);
      io.sockets.in("ROOM_SELECTION").emit("update-room", roomObj);
    });
    socket.on("new-room", function(roomObj){
      io.sockets.in("ROOM_SELECTION").emit("new-room", roomObj);
    });

    socket.on("start-game", function (room, options, numPlayers) {
      console.log("ROOM: ", room);
      var info = assignRoles(options, numPlayers);
      io.sockets.in(room).emit("start-game", info);

      Room.findOne({_id: room})
        .then(roomDoc => {
          roomDoc.active = true;
          roomDoc.info = info;
          return roomDoc.save();
        })

    });

    socket.on('disconnect',function () {
      console.log("discennected");
    })
  });

  return io;

};
