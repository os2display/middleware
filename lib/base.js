/**
 * @file
 * Defined base/super object used by the other library objects to inherit
 * basic methods.
 */

var util = require('util');
var eventEmitter = require('events').EventEmitter;

// Setup logger.
var fs = require('fs');
var Log = require('log');

/**
 * Base object as the module pattern.
 */
var Base = (function() {
  // Load configuration.
  var baseConfig = require('nconf');
  baseConfig.file({ file: 'config.json' });

  // Setup logger.
  var baseLogger = undefined;
  if (baseConfig.get('log')) {
    baseLogger = new Log('info', fs.createWriteStream(baseConfig.get('log'), {'flags': 'a'}));
  }

  // Connect to redis server.
  var redisConf = baseConfig.get('redis');
  var baseRedis = require("redis").createClient(redisConf.port, redisConf.host, { 'auth_pass': redisConf.auth });

  /**
   * Define the Base object.
   */
  var Base = function() {
    var self = this;
    self.config = baseConfig;
    self.redis = baseRedis;
    self.logger = baseLogger;

    self.redis.on('error', function (err) {
      self.error(err);
    });
    self.redis.on("connect", function (err) {
      self.redis.select(redisConf.db, function() {
        if (self.config.get('debug')) {
          console.log('Connected to redis server at: ' + redisConf.host);
        }
      });
    });
  }

  // Extend the object with event emitter.
  util.inherits(Base, eventEmitter);

  /**
   * Emit error message.
   *
   * @private
   */
  Base.prototype.error = function error(code, message) {
    // Check that logger is defined.
    if (this.logger !== undefined) {
      this.logger.error(message);
    }
    this.emit('error', { code: code, message: message });
  }

  /**
   * Log message to log file.
   *
   * @param string message
   *   Message to log to send to the log file.
   */
  Base.prototype.log = function log(message) {
    // Check that logger is defined.
    if (this.logger !== undefined) {
      this.logger.info(message);
    }
  }

  /**
   * Generic get function to extract properties.
   */
  Base.prototype.get = function get(property) {
    var self = this;

    if (self.hasOwnProperty(property)) {
      return self[property];
    }

    self.error(500, 'Get - Property is not defined (' + property + ')');
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
      self.error(500, 'Set - Property is not defined (' + property + ')');
    }
  }

  // Return the inner object.
  return Base;

})();

// Export the object.
module.exports = Base;
