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
    socket.on('ready', function () {
      // Try to get the screen.
      var screen = new Screen(profile.apikey, profile.screenID, profile.activationCode);
      screen.load().then(
        function (screenObj) {
          screenObj.title = profile.screenTitle;
          screenObj.save().then(
            function () {
              // Send a 200 ready code back to the client with information about
              // template and options.
              socket.emit('ready', {
                "statusCode": 200,
                "screen": {
                  "id": screenObj.id,
                  "title": screenObj.title,
                  "options": screenObj.options,
                  "template": screenObj.template
                }
              });

              // Load all channels with the clients api key to see if they have
              // content for the channel.
              cache.membersOfSet('channel:' + profile.apikey, function(err, channels) {
                if (err) {
                  socket.emit('error', {
                    "statusCode": 500,
                    "message": err.message
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
                          // Ask screen to push content.
                          var regions = [];
                          for (var j = 0; j < channelObj.regions.length; j++) {
                            if (channelObj.regions[j].screen === screenObj.id) {
                              regions.push(channelObj.regions[j].region);
                            }
                          }

                          // Send channel content to the current screen.
                          screenObj.push({
                            "regions": regions,
                            "data": channelObj.data
                          });
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
          // Log error.
          logger.error('Client: ' + error.message);

          // Send error to client.
          socket.emit('error', {
            "statusCode": 500,
            "message": error.message
          });
        }
      );
    });

    /**
     * Logout event from the screen which requires the screen to be removed.
     */
    socket.on('logout', function () {
      // Try to get the screen.
      var screen = new Screen(profile.apikey, profile.screenID, profile.activationCode);
      screen.load().then(
        function (screenObj) {
          screenObj.remove().then(
            function () {
              logger.info('Client: Logged out ' + profile.apikey + ':' + profile.screenID);
            },
            function (error) {
              logger.error('Client: ' + error.message);
            }
          );
        },
        function (error) {
          logger.error('Client: ' + error.message);
        }
      );
    });

    /**
     * Heartbeat event.
     *
     * Handle heartbeat event used to check that the screen are alive.
     */
    socket.conn.on('heartbeat', function heartbeat() {
      var screen = new Screen(profile.apikey, profile.screenID);
      screen.load().then(
        function (screenObj) {
          screenObj.heartbeat = Math.round((new Date()).getTime() / 1000);
          screenObj.save();
        },
        function (error) {
          logger.info('Client: unable to load screen to set heartbeat.');
        }
      );
    });
  });

  // Register the plugin with the system.
  register(null, null);
};
