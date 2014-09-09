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
    // Call base class contructor.
    Base.call(this);

    this.id = channelID;
    this.content = undefined;
    this.groups = [];
  }

  // Extend the object with base.
  util.inherits(Channel, Base);

  /**
   * Load channel from cache.
   */
  Channel.prototype.load = function load() {
    var self = this;

    if (self.id !== undefined) {
      // Get channel from cache.
      self.cache.get('channel:' + self.id, function(err, res) {
        if (err) {
          self.logger.error(500, 'Channel cound not be loaded from cache.');
          self.emit('error', { "code": 500, "message": 'Channel cound not be loaded from cache.' }
          return;
        }

        if (res !== null) {
          var data = JSON.parse(res);
          self.id = data.id;
          self.content = data.content;
          self.groups = data.groups;

          // Channel loaded send event.
          self.emit('loaded');
        }
      });
    }
    else {
      self.logger.error(500, 'Load error channel id not set.');
      self.emit('error', { "code": 500, "message": 'Load error channel id not set.' }
    }
  }

  /**
   * Save channel configuration to cache.
   */
  Channel.prototype.save = function save() {
    var self = this;

    // Information to store in cache.
    var data = {
      id: self.id,
      content: self.content,
      groups: self.groups
    }

    // Store the channel.
    self.cache.set('channel:' + self.id, JSON.stringify(data), function(err, res) {
      if (err) {
        self.logger.error(500, 'Cache encounted an error.');
        self.emit('error', { "code": 500, "message": 'Cache encounted an error.' }
        return;
      }

      // Save groups (as lookup index) by value, hence the slice.
      self.saveGroups(self.groups.slice(0));
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
    self.cache.addSet('group:' + group, self.id, function(err, res) {
      if (err) {
        self.logger.error(500, 'Redis encounted an error.');
        self.emit('error', { "code": 500, "message": 'Cache encounted an error.' }
        return;
      }

      if (groups.length !== 0) {
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

    self.cache.del('channel:' + self.id, function(err, res) {
      if (err) {
        self.logger.error(500, 'Redis encounted an error.');
        self.emit('error', { "code": 500, "message": 'Cache encounted an error.' }
        return;
      }

      var len = self.groups.length;
      for (var i = 0; i < len; i++) {
        self.cache.removeSet('group:' + self.groups[i], self.id);
      }

      // Notify that the screen have been removed.
      self.emit('removed');
    });
  }

  /**
   * Push channel to screens that have this channel's groups.
   */
  Channel.prototype.push = function push() {
    // Get socket connection and boardcast message to groups.
    var connection = require('./connection');
    connection.boardcast(this.groups, 'channelPush', this.content);
  }

  // Return the inner object.
  return Channel;

})();

// Export the object.
module.exports = Channel;
