/**
 * @file
 * Used to keep track of screen connections and tokens to identify screens.
 */

var util = require('util');
var Base = require('./base');

/**
 * Screen object as the module pattern.
 */
var Screen = (function() {

  /**
   * Define the screen object.
   *
   * @param string token
   *   The authentication token, which is used to identify the screen.
   */
  var Screen = function(token, id) {
    // Call base class contructor.
    Base.call(this);

    this.id = id;
    this.name = undefined;
    this.groups = [];

    this.token = token;
    this.socketID = undefined;

    this.redis = global.redisClient;
  }

  // Extend the object with event emitter.
  util.inherits(Screen, Base);

  /**
   * Load screen configuration from redis based the object token.
   */
  Screen.prototype.load = function load() {
    var self = this;

    if (self.token !== undefined) {
      // Check if screen exists in redis (token).
      self.redis.hget('screen:lookup:token', self.token, function(err, res) {
        if (err) {
          self.error(500, 'Hash value cound not be loaded from redis');
          return;
        }

        if (res !== null) {
          var data = JSON.parse(res);
          self.id = data.id;

          self.lookup();
        }
        else {
          // Call backend to get screen information.
          var Request = require('./request');
          var req = new Request();
          req.send('/api/screen/get', { token: self.token });

          // Send request to the backend.
          req.on('completed', function(data) {
            self.id = data.id;
            self.name = data.name;
            self.groups = data.groups;

            // Notify that the screen have been loaded.
            self.emit('loaded', { 'cached' : false });
          });

          // Handle request error event.
          req.on('error', function() {
            self.error(404, 'The system could not find the screen.');
          });
        }
      });
    }
    else if (self.id !== undefined) {
      self.lookup();
    }
    else {
      self.error(404, 'The system could not find the screen.');
    }
  }

  /**
   * Lookup the screen in redis.
   *
   * @private
   */
  Screen.prototype.lookup = function lookup() {
    var self = this;

    self.redis.get('screen:' + self.id, function(err, res) {
      if (err) {
        self.error(500, 'Screen cound not be loaded from redis');
        return;
      }

      if (res != null) {
        var data = JSON.parse(res);
        self.name = data.name;
        self.groups = data.groups;
        self.socketID = data.socketID;

        // Notify that the screen have been loaded.
        self.emit('loaded', { 'cached' : true });
      }
      else {
        self.error(404, 'The system could not find the screen.');
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
      socketID: self.socketID
    }

    self.redis.set('screen:' + self.id, JSON.stringify(data), function(err, res) {
      if (err) {
        self.error(500, 'Redis encounted an error');
        return;
      }
      self.redis.hset('screen:lookup:token', self.token, JSON.stringify({ id: self.id }), function(err, res) {
        if (err) {
          self.error(500, 'Redis encounted an error');
          return;
        }

        // Notify that the screen have been saved.
        self.emit('saved');
      });
    });
  }

  /**
   * Remove the screen from cache and close connection.
   */
  Screen.prototype.remove = function remove() {
    var self = this;

    self.redis.del('screen:' + self.id, function(err, res) {
      if (err) {
        self.error(500, 'Redis encounted an error');
        return;
      }

      self.redis.hdel('screen:lookup:token', self.token, function(err, res) {
        if (err) {
          self.error(500, 'Redis encounted an error');
          return;
        }

        var socket = global.sio.sockets.connected[self.socketID];
        socket.disconnect('unauthorized');

        // Notify that the screen have been removed.
        self.emit('removed');
      });
    });
  }

  /**
   * Find content based on the screen groups and push channel to the screen.
   */
  Screen.prototype.push = function push() {
    var self = this;

    var length = self.groups.length;
    for (var i = 0; i < length; i++) {
      self.redis.smembers('group:' + self.groups[i], function(err, res) {
        if (err) {
          self.error(500, 'Redis encounted an error');
          return;
        }

        if (res !== null) {
          // Get socket connection and Channel class.
          var socket = global.sio.sockets.connected[self.socketID];
          var Channel = require('./channel');

          // Loop over channel ID push content to screen.
          var length = res.length;
          for (var i = 0; i < length; i++) {
            var instance = new Channel(res[i]);
            instance.load();
            instance.on('loaded', function() {
              socket.emit('channelPush', instance.get('content'));
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
    // Locate the screens socket.
    var socket = global.sio.sockets.connected[this.socketID];

    // Send reload message
    socket.emit('reload', {});
  }

  return Screen;
})();

// Export the object.
module.exports = Screen;
