/**
 * @file
 * Handle socket communication with the client (frontend).
 */

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Handle socket connection event from screens.
  imports.socket.on('connection', function (socket) {

    // Get the JWT decoded token.
    var profile = socket.client.request.decoded_token;
    console.log(profile);

    /**
     * Ready event.
     */
    socket.on('ready', function () {
      var screen = new imports.screen(profile.apikey, profile.screenID);
      screen.title = profile.title;
      screen.socket = socket;

      screen.save().then(
        function () {

        },
        function (error) {

        }
      );

    });
  });


    // Register the plugin with the system.
  register(null, null);
};
