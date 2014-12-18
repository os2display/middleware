/**
 * @file
 * Handle initial socket communication with the client (frontend).
 */

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Load promise library.
  var Q = require('q');

  // Injections.
  var socket = imports.socket;
  var Screen = imports.screen;
  var logger = imports.logger;
  var cache = imports.cache;
  var Channel = imports.channel;

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
      var screen = new Screen(profile.apikey, profile.screenID);
      screen.load().then(
        function (screenObj) {
          screenObj.title = profile.screenTitle;
          screenObj.save().then(
            function () {
              // Send a 200 ready code back to the client.
              socket.emit('ready', {
                "statusCode": 200
              });

              // Load all channels with the clients api key to see if they have
              // content for the channel.
              cache.membersOfSet(profile.apikey, function(err, channels) {
                if (err) {
                  socket.emit('error', {
                    "statusCode": 500,
                    "message": error.message
                  });
                }
                else {
                  // Loop over channel ID's and load channels.
                  for (var i in channels) {
                    var channel = new Channel(profile.apikey, channels[i]);

                    // Load channel to get screens.
                    channel.load().then(
                      function (channelObj) {
                        // Check if channel has the screen.
                        if (channelObj.hasScreen(profile.screenID)) {
                          // Send channel content to the current screen.
                          screenObj.push(channelObj.data);
                        }
                      },
                      function (error) {
                        socket.emit('error', {
                          "statusCode": 500,
                          "message": error.message
                        });
                      }
                    );
                  }
                }
              });

              /**
               * @TODO: Push content if content is ready.
               *
               * Loop over all channels and push content to the screen.
               */
            },
            function (error) {
              // Send error to client.
              socket.emit('error', {
                "statusCode": 500,
                "message": error.message
              });
            }
          );
        },
        function (error) {
          // Send error to client.
          socket.emit('error', {
            "statusCode": 500,
            "message": error.message
          });

          // Log error.
          logger.error('Client: ' + error.message);
        }
      );
    });
  });

  // Register the plugin with the system.
  register(null, null);
};
