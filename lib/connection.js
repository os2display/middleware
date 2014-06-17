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
var Connection = (function() {

  // Hold Socket.io object, when configured.
  var sio;

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
  var Connection = function(server, debug, secret) {
    var self = this;

    // Call base class contructor.
    Base.call(this);

    // Ensure that this is only runned once.
    if (!global.sio) {
      sio = require('socket.io')(server);

      // Store the configuration and socket.io ref. in global variable
      // to ensure that only one  exists.
      global.sio = sio;

      // Set socket.io client configuration.
      if (debug === false) {
        sio.enable('browser client minification');
        sio.enable('browser client etag');
        sio.enable('browser client gzip');
      }

      // Ensure that the JWT is used to authenticate socket.io connections.
      // Token based auth.
      var socketio_jwt = require('socketio-jwt');
      sio.set('authorization', socketio_jwt.authorize({
        secret: secret,
        handshake: true
      }));

      // Handle incomming connection.
      var Client = require('./client');
      sio.on('connection', function(socket) {
        // Send socket wrapper object.
        self.emit('connection', new Client(socket));
      });
    }
  }

  // Extend the object with event emitter.
  util.inherits(Connection, Base);

  return Connection;
})();

// Export the object.
module.exports = Connection;
