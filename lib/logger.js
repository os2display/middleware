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

  this.error = function error(code, message) {
    if (log !== undefined) {
      log.error(message);
    }
    this.emit('error', { code: code, message: message });
  }

  this.info = function error(code, message) {
    if (log !== undefined) {
      log.info(message);
    }
    this.emit('error', { code: code, message: message });
  }

  this.debug = function error(code, message) {
    if (log !== undefined) {
      log.debug(message);
    }
    this.emit('error', { code: code, message: message });
  }

  // Extend the object with event emitter.
  util.inherits(Logger, eventEmitter);

  // Set logger.
  log = new Log('debug', fs.createWriteStream(config.get('log'), {'flags': 'a'}));
});

// Export the object (exports uses cache, hence singleton).
module.exports = new Logger();