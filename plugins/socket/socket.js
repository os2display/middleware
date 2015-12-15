/**
 * @file
 * Provides web-socket integration through socket.io.
 */

// Private variables.
var sio;

// Load JWT to handle secure auth.
var jwt = require("socketio-jwt");

// Book keeper of active socket connections.
var sockets = {};

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

  // Get socket.io started.
  sio = require('socket.io')(server);

  // Authentication.
  sio.set('authorization', jwt.authorize({
    secret: secret,
    handshake: true
  }));
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
 * Add active socket connection.
 *
 * @param key
 *   Key to store the socket under.
 * @param socket
 *   Socket connection object.
 */
SocketIO.prototype.add = function add(key, socket) {
  "use strict";

  sockets[key] = socket;
};

/**
 * Remove active socket connection.
 *
 * @param key
 *   Key to remove the socket under.
 */
SocketIO.prototype.remove = function remove(key) {
  "use strict";

  if (sockets.hasOwnProperty(key)) {
    delete sockets[key];
    return true;
  }

  return false;
};

/**
 * Get socket connection from apikey and client id.
 *
 * @param apikey
 *   API key for client.
 * @param id
 *   Client ID.
 *
 * @returns {*}
 *   Socket connection or false if not connected.
 */
SocketIO.prototype.get = function get(apikey, id) {
  "use strict";

  // Create key to store socket under.
  var key = apikey + ':' + id;

  // Check if key exists.
  if (sockets.hasOwnProperty(key)) {
    return sockets[key];
  }

  return false;
};

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Get logger.
  var logger = imports.logger;

  // Ensure that only one socket server exists.
  var socketIO = new SocketIO(imports.server, options.secret);

  // Listen to connections an store socket.
  socketIO.on('connection', function (socket) {
    // Capture all "emit" to log them.
    socket.emitOrg = socket.emit;
    socket.emit = function emit(ev) {
      //console.log('Emit: ' + ev + ' : ' + socket.id);
      var profile = socket.client.request.decoded_token;
      var args = Array.prototype.slice.call(arguments);
      logger.socket('Emit <-> ' + ev + ' (' + profile.apikey + ' : ' + profile.screenID + ')', args);
      socket.emitOrg.apply(socket, args);
    }

    // Capture all "on" to log them.
    socket.onOrg = socket.on;
    socket.on = function on(ev) {
      //console.log('On: ' + ev + ' : ' + socket.id);
      var profile = socket.client.request.decoded_token;
      var args = Array.prototype.slice.call(arguments);
      logger.socket('On <-> ' + ev + ' (' + profile.apikey + ' : ' + profile.screenID + ')', args);
      socket.onOrg.apply(socket, args);
    }
  });

  // Register exposed function with architect.
  register(null, {
    onDestruct: function (callback) {
      imports.server.close(callback);
      imports.logger.debug('Express server stopped');
    },
    "socket": socketIO
  });
};
