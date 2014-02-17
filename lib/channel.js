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

    this.load();
  }

  // Extend the object with base.
  util.inherits(Channel, Base);

  /**
   * Load channel from redis.
   */
  Channel.prototype.load = function load() {
    var self = this;

    if (self.id !== undefined) {
      self.redis.get('channel:' + self.id, function(err, res) {
        if (err) {
          self.error(500, 'Channel cound not be loaded from redis');
          return;
        }

        if (res !== null) {
          self.id = res.id;
          self.content = res.content;
          self.groups = res.groups;

          self.emit('loaded', {});
        }
      });
    }
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
    self.redis.sadd('group:' + group, self.id), function(err, res) {
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
    var self = this;

    self.redis.del('channel:' + self.id, function(err, res) {
      if (err) {
        self.error(500, 'Redis encounted an error');
        return;
      }

      var length = self.groups.length;
      for (var i = 0; i < length; i++) {
        self.redis.srem('group:' + self.groups[i], self.id);
      }

      // Notify that the screen have been removed.
      self.emit('removed');
    });
  }

  /**
   * Push channel to screens that have this channel's groups.
   */
  Channel.prototype.push = function push() {
    var length = self.groups.length;
    for (var i = 0; i < length; i++) {
      global.sio.sockets.in(self.groups[i]).emit('channelPush', this.content);
    }
  }

  /**
   * Get channel content as JSON.
   */
  Channel.prototype.getJSON = function getJSON() {
    return this.content;
  }

  return Channel;

})();

// Export the object.
module.exports = Channel;
