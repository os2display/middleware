/**
 * @file
 * Used to keep track of screen connections and tokens to identify screens.
 */
var util = require('util');
var eventEmitter = require('events').EventEmitter;

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
    this.id = id;
    this.name = undefined;
    this.groups = [];

    this.token = token;
    this.socketID = undefined;

    this.redis = global.redisClient;

    this.load();
  }

  // Extend the object with event emitter.
  util.inherits(Screen, eventEmitter);

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
        }

        if (res != null) {
          var data = JSON.parse(res);
          self.id = data.id;

          self.lookup();
        }
        else {
          // Call backend to get screen information.
          // @TODO: call backend.
          console.log('INSERTING DUMMY DATA INTO SCREEN');
          self.id = 'test1234';
          self.name = 'TEST ' + self.id;
          self.groups = [ '43218765' ];

          self.emit('loaded', { 'cached' : false });
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
      name: self.name,
      groups: self.groups,
      socketID: self.socketID
    }

    self.redis.set('screen:' + self.id, JSON.stringify(data), function(err, res) {
      if (err) {
        self.error(500, 'Redis encounted an error');
      }
      self.redis.hset('screen:lookup:token', self.token, JSON.stringify({ id: self.id }), function(err, res) {
        if (err) {
          self.error(500, 'Redis encounted an error');
        }

        // Notify that the screen have been saved.
        self.emit('saved');
      });
    });
  }

  /**
   * Emit error message.
   *
   * @private
   */
  Screen.prototype.error = function error(code, message) {
    this.emit('error', { code: code, message: message });
  }

  /**
   * Reload screen
   */
  Screen.prototype.reload = function reload() {
    // Locate the screens socket.
    var socket = global.sio.sockets.socket(this.socketID);

    // Send reload message
    socket.emit('reload', {});
  }

  /**
   * Generic get function to extract properties.
   */
  Screen.prototype.get = function get(property) {
    var self = this;

    if (self.hasOwnProperty(property)) {
      return self[property];
    }

    self.error(500, 'Get - Property is not defined (' + property + ')');
  }

  /**
   * Generic set function to set properties.
   */
  Screen.prototype.set = function set(property, value) {
    var self = this;

    if (self.hasOwnProperty(property)) {
      self[property] = value;
    }
    else {
      self.error(500, 'Set - Property is not defined (' + property + ')');
    }
  }

  return Screen;
})();

// Export the object.
module.exports = Screen;
