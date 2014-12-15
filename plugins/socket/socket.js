/**
 * @file
 * Provides web-socket integration through socket.io.
 */

// Private variables.
var sio;

// Load JWT to handle secure auth.
var jwt = require("socketio-jwt");

// Get promise support.
var Q = require('q');

/**
 * Default constructor.
 *
 * @param server
 *   The http server to attached socket.io.
 * @param secret
 *   The secret key decode security token.
 */
var SocketIO = function(server, secret) {
  "use strict";

  this.secret= secret;

  // Get socket.io started.
  sio = require('socket.io')(server);
};

/**
 * Sockets connection events etc.
 */
SocketIO.prototype.on = function on(eventName, callback) {
  "use strict";

  sio.on(eventName, function() {
    callback.apply(sio, arguments);
  });
};

/**
 * Sockets emit function.
 */
SocketIO.prototype.emit = function emit(eventName, data, callback) {
  "use strict";

  sio.emit(eventName, data, function() {
    if (callback) {
      callback.apply(sio, arguments);
    }
  });
};

/**
 * Handle JWT socket authentication.
 */
SocketIO.prototype.auth = function auth() {
  "use strict";

  var deferred = Q.defer();

  sio.sockets.on('connection', jwt.authorize({
    secret: this.secret,
    timeout: 5000
  })).on('authenticated', function(socket) {
    deferred.resolve(socket);
  });

  return deferred.promise;
};

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Ensure that only one socket server exists.
  var socketIO = new SocketIO(imports.server, options.secret || undefined);

  // Register exposed function with architect.
  register(null, {
    onDestruct: function (callback) {
      imports.server.close(callback);
      imports.logger.debug('Express server stopped');
    },
    "socket": socketIO
  });
};
