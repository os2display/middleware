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

  delete sockets[key];
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
    // Get the JWT decoded token.
    var profile = socket.client.request.decoded_token;

    // Create key to store socket under.
    var key = profile.apikey + ':' + profile.screenID;

    // Check if activation code is in use or has been used.
    imports.cache.hashGet('activation:' + profile.apikey, profile.activationCode, function(error, value) {
      if (value === null) {
        // Store the activation code in a hash table use to ensure that no more
        // than one screen exists for that activation code.
        imports.cache.hashSet('activation:' + profile.apikey, profile.activationCode, profile.screenID, function(error, res) {
          if (error) {
            logger.error('Auth: Activation code hash could not be updated.');
          }
          else {
            // No activation error, so carry on.
            registerSocket(socket, key, profile);
          }
        });
      }
      else {
        // Check if the registred screen is different that the one in the cache.
        if (socketIO.get(profile.apikey, profile.screenID)) {
          // It is a nother screen to don't connect, kick it.
          logger.info('Screen tried to re-connect with used activation code: ' + profile.activationCode + ', apikey: ' + profile.apikey + ', screen id: ' + profile.screenID)
          socket.emit('booted', {"statusCode": 404});
          socket.disconnect();
        }
        else {
          // No conflict in key usage, so lets carry on.
          registerSocket(socket, key, profile);
        }
      }
    });
  });

  /**
   * Register information about the socket and add event listeners.
   */
  function registerSocket(socket, key, profile) {
    // Log connection event.
    logger.socket("Connected " + profile.apikey + ' : ' + profile.screenID + ' : ' + socket.id);

    // Capture all "emit" to log them.
    socket.emitOrg = socket.emit;
    socket.emit = function(ev) {
      var args = Array.prototype.slice.call(arguments);
      logger.socket('Emit <-> ' + ev + ' (' + profile.apikey + ' : ' + profile.screenID + ')', args);
      socket.emitOrg.apply(socket, args);
    }

    // Capture all "on" to log them.
    socket.onOrg = socket.on;
    socket.on = function(ev) {
      var args = Array.prototype.slice.call(arguments);
      logger.socket('On <-> ' + ev + ' (' + profile.apikey + ' : ' + profile.screenID + ')', args);
      socket.onOrg.apply(socket, args);
    }

    // Add socket to store.
    socketIO.add(key, socket);

    // Listen to disconnect and remove socket from store.
    socket.on('disconnect', function() {
      socketIO.remove(key);

      // Log dis-connection event.
      logger.socket("Disconnected " + profile.apikey + ' <-:-> ' + profile.screenID);
    });
  }

  // Register exposed function with architect.
  register(null, {
    onDestruct: function (callback) {
      imports.server.close(callback);
      imports.logger.debug('Express server stopped');
    },
    "socket": socketIO
  });
};
