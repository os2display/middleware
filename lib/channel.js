/**
 * @file
 * Defines a basic channel with slides as content.
 */

var util = require('util');
var Base = require('./base');

/**
 * Channel object as the module pattern.
 */
var Channel = (function() {

  /**
   * Define the channel object.
   */
  var Channel = function() {

  }

  // Extend the object with base.
  util.inherits(Channel, Base);

  /**
   * Load screen configuration from redis based the object token.
   */
  Channel.prototype.load = function load() {
    this.error(501, 'Not Implemented');
  }

  /**
   * Save channel configuration to redis.
   */
  Channel.prototype.save = function save() {
    this.error(501, 'Not Implemented');
  }

  /**
   * Remove the channel from cache.
   */
  Channel.prototype.remove = function remove() {
    this.error(501, 'Not Implemented');
  }

  /**
   * Get channel content as JSON.
   */
  Channel.prototype.getJSON = function getJSON() {
    this.error(501, 'Not Implemented');
  }

  return Channel;

})();

// Export the object.
module.exports = Channel;
