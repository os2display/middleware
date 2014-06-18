/**
 * @file
 * Used to keep track of a given connection to a client.
 */

var util = require('util');
var Base = require('./base');

/**
 * Connection object as the module pattern that wrappes basic
 * socket.io communication for the application.
 */
var connection = (function() {

  /**
   * Defines the Connection object that handles Socket.io configuration and setup.
   *
   * @todo: Change this object to a singleton.
   *
   * @param server
   *   HTTP or HTTPS server to attach the socket to.
   * @param debug
   *   If true minification and compression will be disabled.
   * @param secret
   *   Secret string to use when authenticate new connections.
   */
  var Connection = function() {
    // Call base class contructor.
    Base.call(this);

    this.sio = undefined;
  }

  // Extend the object with event emitter.
  util.inherits(Connection, Base);

  Connection.prototype.connect = function connect(server, debug, secret) {
    var self = this;

    // Ensure that this is only runned once.
    if (self.sio === undefined) {
      self.sio = require('socket.io')(server);

      // Set socket.io client configuration.
      if (debug === false) {
        self.sio.enable('browser client minification');
        self.sio.enable('browser client etag');
        self.sio.enable('browser client gzip');
      }

      // Ensure that the JWT is used to authenticate socket.io connections.
      // Token based auth.
      var socketio_jwt = require('socketio-jwt');
      self.sio.set('authorization', socketio_jwt.authorize({
        secret: secret,
        handshake: true
      }));

      // Handle incomming connection.
      var Client = require('./client');
      self.sio.on('connection', function(socket) {
        // Send socket wrapper object.
        self.emit('connection', new Client(socket));
      });
    }
  }

  Connection.prototype.boardcast = function boardcast(groups, event, data) {
    if (this.sio !== undefined) {
      var len = groups.length;
      for (var i = 0; i < len; i++) {
        this.log('Boardcast event (' + event +') for: ' + groups[i]);
        this.sio.sockets.in(groups[i]).emit(event, data);
      }
    }
  }

  return new Connection();
})();

// Export the object.
module.exports = connection;
