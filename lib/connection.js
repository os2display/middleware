/**
 * @file
 * Used to keep track of a given connection to a client.
 */

var util = require('util');
var Base = require('./base');

// Variable to hold socket definition.
var sio;

/**
 * Connection object as the module pattern.
 */
var Connection = (function() {

  var Connection = function() {
    // Call base class contructor.
    Base.call(this);

  }

  // Extend the object with event emitter.
  util.inherits(Connection, Base);

  return Connection;
})();

// Export the object.
exports.Connection = Connection;

/**
 * Handle Socket.io configuration and setup.
 */
exports.init = function init(server, debug) {
  sio = require('socket.io')(server);

  // @todo: Remove when code have been updated.
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
    secret: config.get('secret'),
    handshake: true
  }));
}
