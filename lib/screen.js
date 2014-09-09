/**
 * @file
 * Used to keep track of a screen.
 */

var util = require('util');
var Base = require('./base');

var Request = require('./request');

/**
 * Define the screen object.
 *
 * @param string token
 *   The authentication token, which is used to identify the screen.
 */
var Screen = function(token, client) {
  // Call base class contructor.
  Base.call(this);

  // Save token and client ref.
  this.token = token;
  this.client = client;

  this.name = undefined;
  this.groups = [];
}

// Extend the object with event emitter.
util.inherits(Screen, Base);

/**
 * Load screen configuration from Redis based the object token.
 */
Screen.prototype.load = function load() {
  var self = this;

  self.cache.get('screen:' + self.token, function(err, res) {
    if (err) {
      self.logger.error(500, 'Screen could not be loaded from redis.');
      self.emit('error', { "code": 500, "message": 'Screen could not be loaded from redis.' });
      return;
    }

    if (res != null) {
      var data = JSON.parse(res);
      self.name = data.name;
      self.groups = data.groups;

      // Notify that the screen have been loaded.
      self.emit('loaded', { 'cached' : true });
    }
    else {
      // Call backend to get screen information.
      var req = new Request();
      req.send('/api/screen/get', { token: self.token });

      // Send request to the backend.
      req.on('completed', function(data) {
        self.name = data.name;
        self.groups = data.groups;

        // Notify that the screen have been loaded.
        self.emit('loaded', { 'cached' : false });
      });

      // Handle request error event.
      req.on('error', function() {
        self.logger.error(404, 'The system could not find the screen.');
        self.emit('error', { "code": 404, "message": 'The system could not find the screen.' });
      });
    }
  });
}

/**
 * Save screen configuration to redis.
 */
Screen.prototype.save = function save() {
  var self = this;

  // Information to store in redis.
  var data = {
    id: self.id,
    name: self.name,
    groups: self.groups,
  }

  self.cache.set('screen:' + self.token, JSON.stringify(data), function(err, res) {
    if (err) {
      self.logger.error(500, 'Redis encounted an error');
      self.emit('error', { "code": 500, "message": 'Redis encounted an error.' });
    }
    else {
      // Notify that the screen have been saved.
      self.emit('saved');
    }
  });
}

/**
 * Remove the screen from cache and close connection.
 */
Screen.prototype.remove = function remove() {
  var self = this;

  self.cache.remove('screen:' + self.id, function(err, res) {
    if (err) {
      self.logger.error(500, 'Redis encounted an error');
      self.emit('error', { "code": 500, "message": 'Redis encounted an error.' });
      return;
    }

    // Inform the client/screen.
    self.client.kick(404)

    // Notify that the screen have been removed.
    self.emit('removed');
  });
}

/**
 * Find content based on the screen groups and push channel to the screen.
 */
Screen.prototype.push = function push() {
  var self = this;

  var length = self.groups.length;
  for (var i = 0; i < length; i++) {
    self.cache.membersOfSet('group:' + self.groups[i], function(err, res) {
      if (err) {
        self.logger.error(500, 'Redis encounted an error');
        self.emit('error', { "code": 500, "message": 'Redis encounted an error.' });
        return;
      }

      if (res !== null) {
        var Channel = require('./channel');

        // Loop over channel ID push content to screen.
        var length = res.length;
        for (var i = 0; i < length; i++) {
          var instance = new Channel(res[i]);
          instance.load();
          instance.on('loaded', function() {
            self.client.channelPush(instance.get('content'));
          });
        }
      }
    });
  }
}

/**
 * Reload screen
 */
Screen.prototype.reload = function reload() {
  // Send reload message.
  this.client.reload();
}

// Export the object.
module.exports = Screen;
