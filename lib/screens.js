/**
 * @file
 * Used to keep track of screen connections and tokens to identify screens.
 */

var util = require('util');
var Base = require('./base');
var Screen = require('./screen');

var screens = (function() {
  var Screens = function() {
    this.screens = {};
  };

  Screens.prototype.get = function get(token) {
    if (this.screens.hasOwnProperty(token)) {
      return this.screens[token]
    }
    return undefined;
  }

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

  Screens.prototype.removeScreen = function removeScreen(token) {
    delete this.screens[token];
  }

  return new Screens();
})();

// Export the object (singleton).
module.exports = screens;
