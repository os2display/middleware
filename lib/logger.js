/**
 * @file
 * This is a wrapper class to hande the system logger.
 */

/**
 * Logger object implemented as a singleton module pattern.
 */
var Logger = (function() {

  // Node core modules.
  var fs = require('fs');
  var eventEmitter = require('events').EventEmitter;
  var util = require('util');

  // NPM modules.
  var Log = require('log');

  // Custom modules.
  var config = require('./configuration');

  var log;
  var self;

  /**
   * Define the Base object (constructor).
   */
  var Logger = function() {
    // Set self to the object's this (singleton) to make it available
    // to inner private functions.
    self = this;

    // Set logger.
    log = new Log('debug', fs.createWriteStream(config.get('log'), {'flags': 'a'}));
  }

  // Extend the object with event emitter.
  util.inherits(Logger, eventEmitter);

  Logger.prototype.error = function error(code, message) {
    if (log !== undefined) {
      log.error(message);
    }
    this.emit('error', { code: code, message: message });
  }

  Logger.prototype.info = function info(code, message) {
    if (log !== undefined) {
      log.info(message);
    }
    this.emit('info', { code: code, message: message });
  }

  Logger.prototype.debug = function debug(code, message) {
    if (log !== undefined) {
      log.debug(message);
    }
    this.emit('debug', { code: code, message: message });
  }

  return Logger;
})();

// Export the object (exports uses cache, hence singleton).
module.exports = new Logger();