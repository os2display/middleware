/**
 * @file
 * Wrapper module for screens to keep track of connection and activiti.
 */

var util = require('util');
var Base = require('./base');
var Screen = require('./screen');

var screens = (function() {

  /**
   * Screens object to hold Screen objects.
   *
   * This wrapper exists as the backend may send requests, that
   * requires the connection to the screen/client and the screen
   * object hold that connection as a client object.
   *
   * So this singleton object holds track of active screens and
   * gives access to the socket connection.
   */
  var Screens = function() {
    this.screens = {};
  };

  /**
   * Get screen object based on token.
   *
   * @param string token
   *   Token used to identify a screen.
   *
   * @return screen
   *   If screen is found screen object is returnd else undefined.
   */
  Screens.prototype.get = function get(token) {
    if (this.screens.hasOwnProperty(token)) {
      return this.screens[token]
    }
    return undefined;
  }

  /**
   * Creates a new screen object.
   *
   * @param string token
   *   Token to identify the screen.
   * @param object client
   *   Client object returned from the socket connection event.
   */
  Screens.prototype.createScreen = function createScreen(token, client) {
    var self = this;

    var instance = this.get(token);
    if (instance === undefined) {
      var instance = new Screen(token, client);
      this.screens[token] = instance;

      // Handle screen remove event.
      instance.on('removed', function() {
        self.removeScreen(token);
      });
    }

    return instance;
  }

  /**
   * Remove screen from active screens.
   *
   * @param string token
   *   Token to identify the screen.
   */
  Screens.prototype.removeScreen = function removeScreen(token) {
    delete this.screens[token];
  }

  // Innter screens object (as singleton).
  return new Screens();

})();

// Export the object (singleton).
module.exports = screens;
