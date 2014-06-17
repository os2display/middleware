/**
 * @file
 * Client object to represent a client connected to the system.
 */

var util = require('util');
var Base = require('./base');

/**
 * Connection object as the module pattern that wrappes basic
 * socket.io communication for the application.
 */
var Client = (function() {


  /**
   *
   */
  var Client = function(socketIO) {
    // Call base class contructor.
    Base.call(this);

    // Store socket connetion.
    this.socket = socketIO;
    this.id = socketIO.id;

    var self = this;

    // Handle ready event.
    socketIO.on('ready', function(data) {
      self.emit('ready', data);
    });

    // Handle pause event
    socketIO.on('pause', function(data) {
      self.emit('pause', data);
    });

    socketIO.on('disconnect', function(data) {
      self.emit('disconnect', data);
    });
  }

  // Extend the object with event emitter.
  util.inherits(Client, Base);

  Client.prototype.ready = function ready(code) {
    this.log('Ready event for: ' + this.id);
    this.socket.emit('ready', { "statusCode": code });
  }

  Client.prototype.kick = function kick(code) {
    this.log('Kicked client: ' + this.id);
    this.socket.emit('booted', { "statusCode": code });
    this.socket.disconnect();
  }

  Client.prototype.reload = function reload() {
    this.socket.emit('reload');
  }

  Client.prototype.channelPush = function channelPush(content) {
    this.log('Channel push event for: ' + this.id);
    this.socket.emit('channelPush', content);
  }

  Client.prototype.pause = function pause(code) {
    this.log('Pause event for: ' + this.id);
    this.socket.emit('pause', { "statusCode": code });
  }

  Client.prototype.join = function join(groups) {
    for (var i in groups) {
      this.socket.join(groups[i]);
    }
  }

  Client.prototype.leaveRooms = function leaveRooms() {
    var rooms = sio.sockets.manager.roomClients[socket.id];

    // Remove the socket from the rooms.
    for (var room in rooms) {
      room = room.substring(1);
      socket.leave(room);
    }
  }

  Client.prototype.disconnect = function disconnect() {
    this.socket.disconnect();
  }

  Client.prototype.getSocket = function getSocket() {
    return this.socket;
  }

  Client.prototype.getToken = function getToken() {
    return this.socket.handshake.query.token;
  }

  return Client;
})();

// Export the object.
module.exports = Client;
