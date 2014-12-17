/**
 * @file
 * Handle socket communication with the client (frontend).
 */

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Load promise library.
  var Q = require('q');

  // Activate client placeholder.
  var clients = {};

  // Injections.
  var socket = imports.socket;
  var Screen = imports.screen;
  var logger = imports.logger;

  /**
   * Try to get screen information.
   *
   * @param apikey
   * @param id
   * @returns {*}
   */
  function getScreen(apikey, id) {
    var deferred = Q.defer();

    // Check if API key index exists.
    if (!clients.hasOwnProperty(apikey)) {
      // Add API key.
      clients[apikey] = {};
    }

    // Check if screen exists.
    if (!clients[apikey].hasOwnProperty(id)) {
      // Try to load the screen.
      var screen = new Screen(apikey, id);
      screen.load().then(
        function () {
          // Store screen in static cache.
          clients[apikey][id] = screen;
          deferred.resolve(clients[apikey][id]);
        },
        function (error) {
          deferred.reject(error);
        }
      );
    }
    else {
      deferred.resolve(clients[apikey][id]);
    }

    return deferred.promise;
  }

  /**
   * Handle socket connection event from a client.
   */
  socket.on('connection', function (socket) {
    // Get the JWT decoded token.
    var profile = socket.client.request.decoded_token;

    /**
     * Ready event.
     */
    socket.on('ready', function (state) {
      // Try to get the screen.
      getScreen(profile.apikey, profile.screenID).then(
        function (screen) {
          // Set socket on the object.
          screen.socket = socket;

          // Send a 200 ready code back to the client.
          screen.socket.emit('ready', {
            "statusCode": 200
          });

          /**
           * @TODO: Push content if content is ready.
           */
          // Loop over all channels and push content to the screen.
        },
        function (error) {
          // Send error to client.
          screen.socket.emit('error', {
            "statusCode": 500,
            "message": error.message
          });

          // Log error.
          logger.error('Client: ' + error.message);
        }
      );
    });

    socket.on('disconnect', function() {
      getScreen(profile.apikey, profile.screenID).then(
        function (screen) {
          // Remove the socket connection on the screen.
          screen.socket = undefined;
        },
        function (error) {
          logger.error('Client: disconnected screen do not exists.');
        }
      );
    });
  });

  // Register the plugin with the system.
  register(null, {
    "client" : {
      'getScreen': getScreen
    }
  });
};
