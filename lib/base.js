/**
 * @file
 * Defined base/super object used by the other library objects to inherit
 * basic methods.
 */

/**
 * Base object as the module pattern.
 */
var Base = (function() {
  var util = require('util');
  var eventEmitter = require('events').EventEmitter;

  /**
   * Define the Base object (constructor).
   */
  var Base = function() {
    this.config = require('./configuration');
    this.cache = require('./cache');
    this.logger = require('./logger');
  }

  // Extend the object with event emitter.
  util.inherits(Base, eventEmitter);

  /**
   * Generic get function to extract properties.
   */
  Base.prototype.get = function get(property) {
    var self = this;

    if (self.hasOwnProperty(property)) {
      return self[property];
    }

    self.logger.error(500, 'Get - Property is not defined (' + property + ')');
  }

  /**
   * Generic set function to set properties.
   */
  Base.prototype.set = function set(property, value) {
    var self = this;

    if (self.hasOwnProperty(property)) {
      self[property] = value;
    }
    else {
      self.logger.error(500, 'Set - Property is not defined (' + property + ')');
    }
  }

  // Return the inner object.
  return Base;
})();

// Export the object.
module.exports = Base;
