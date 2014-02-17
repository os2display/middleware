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
   *
   * @param string channelID
   *   ID to indetify the channel.
   */
  var Channel = function(channelID) {
    this.id = channelID;
    this.content = undefined;
    this.groups = [];
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
    var self = this;

    // Information to store in redis.
    var data = {
      id: self.id,
      content: self.content,
      groups: self.groups
    }

    // Store the channel
    self.redis.set('channel:' + self.id, JSON.stringify(data), function(err, res) {
      if (err) {
        self.error(500, 'Redis encounted an error');
        return;
      }

      // Save groups (as lookup index).
      self.saveGroups(self.groups);
    });
  }

  /**
   * Recursively loops over the channel's groups creating a redis indexes.
   *
   * @private
   *
   * @param array groups
   *   The groups that needs to be saved.
   */
  Channel.prototype.saveGroups = function saveGroups(groups) {
    var self = this;
    var group = groups.pop();
    self.redis.sadd('channel:lookup:' + group, self.id), function(err, res) {
      if (err) {
        self.error(500, 'Redis encounted an error');
        return;
      }

      if (goups.length !== 0) {
        // Next interation.
        self.saveGroups(groups);
        return;
      }

      // Notify that the channel have been saved.
      self.emit('saved');
    });
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
