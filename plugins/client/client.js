/**
 * @file
 * Handle socket communication with the client (frontend).
 */

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";


  imports.socket.on('connection', function (socket) {
    /**
     * Ready event.
     */
    socket.on('ready', function (data) {
      console.log(data);
    });
  });


    // Register the plugin with the system.
  register(null, null);
};
