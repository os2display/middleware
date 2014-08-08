/**
 * @file
 * Client object to handle a client/screens connection and requests.
 */

var util = require('util');
var Base = require('./base');

/**
 * Client object as the module pattern that wrappes basic
 * socket.io communication for a given client/screen.
 */
var Client = (function() {

  /**
   * Client object to handle communication with the screen.
   */
  var Client = function(socketIO) {
    var self = this;

    // Call base class contructor.
    Base.call(this);

    // Store socket connetion.
    this.socket = socketIO;
    this.id = socketIO.id;

    // Handle ready event.
    socketIO.on('ready', function(data) {
      self.emit('ready', data);
    });

    // Handle pause event
    socketIO.on('pause', function pause(data) {
      self.emit('pause', data);
    });

    // Handle disconnect event.
    socketIO.on('disconnect', function disconnect(data) {
      self.emit('disconnect', data);
    });

    // Handle heartbeat event.
    socketIO.conn.on('heartbeat', function heartbeat(data) {
      self.emit('heartbeat');
    });
  }

  // Extend the object with event emitter.
  util.inherits(Client, Base);

  /**
   * Send ready event to the client.
   *
   * @param int code
   *   Statuc code, which normally will be HTTP status codes.
   */
  Client.prototype.ready = function ready(code) {
    this.logger.debug(200, 'Ready event for: ' + this.id);
    this.socket.emit('ready', { "statusCode": code });
  }

  /**
   * Send "booted" message to the client and disconnect it.
   *
   * @param int code
   *   Statuc code, which normally will be HTTP status codes.
   */
  Client.prototype.kick = function kick(code) {
    this.logger.debug(200, 'Kicked client: ' + this.id);
    this.socket.emit('booted', { "statusCode": code });
    this.socket.disconnect();
  }

  /**
   * Send reload message to the client.
   */
  Client.prototype.reload = function reload() {
    this.logger.debug(200, 'Reload event for: ' + this.id);
    this.socket.emit('reload');
  }

  /**
   * Push content to the client.
   *
   * @param array content
   *   Content formatted as described in the API documentation.
   */
  Client.prototype.channelPush = function channelPush(content) {
    this.logger.debug(200, 'Channel push event for: ' + this.id);
    this.socket.emit('channelPush', content);
  }

  /**
   * Send pause message to client.
   *
   * @param int code
   *   Statuc code, which normally will be HTTP status codes.
   */
  Client.prototype.pause = function pause(code) {
    this.logger.debug(200, 'Pause event for: ' + this.id);
    this.socket.emit('pause', { "statusCode": code });
  }

  /**
   * Join socket.io groups.
   *
   * @param array groups
   *   Array of group names as strings.
   */
  Client.prototype.join = function join(groups) {
    var len = groups.length;
    for (var i = 0; i < len; i++) {
      this.socket.join(groups[i]);
    }
  }

  /**
   * Leave socket.io groups.
   *
   * @param array groups
   *   Array of group names as strings.
   */
  Client.prototype.leave = function leave(groups) {
    var len = groups.length;
    for (var i = 0; i < len; i++) {
      this.socket.leave(groups[i]);
    }
  }

  /**
   * Boardcast message and data to socket.io groups.
   *
   * @param array groups
   *   Array of group names as strings.
   * @param string event
   *   Name of the event to send.
   * @param array data
   *   Content formatted as described in the API documentation.
   */
  Client.prototype.boardcast = function boardcast(groups, event, data) {
    var len = groups.length;
    for (var i = 0; i < len; i++) {
      this.socket.in(groups[i]).emit(event, data);
    }
  }

  /**
   * Disconnect the client.
   */
  Client.prototype.disconnect = function disconnect() {
    this.socket.disconnect();
  }

  /**
   * Get the socket.io socket.
   *
   * @return socket
   *   The raw socket.io socket object.
   */
  Client.prototype.getSocket = function getSocket() {
    return this.socket;
  }

  /**
   * Get the token used to authenticate this client.
   */
  Client.prototype.getToken = function getToken() {
    return this.socket.handshake.query.token;
  }

  return Client;
})();

// Export the object.
module.exports = Client;
