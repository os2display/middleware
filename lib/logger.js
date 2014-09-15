/**
 * @file
 * This is a wrapper class to hande the system logger.
 */

// Node core modules.
var fs = require('fs');
var eventEmitter = require('events').EventEmitter;
var util = require('util');

// NPM modules.
var Log = require('log');

// Custom modules.
var config = require('./configuration');

var log;

/**
 * Define the Base object (constructor).
 */
var Logger = function() {
  // Set logger.
  log = new Log('debug', fs.createWriteStream(config.get('log'), {'flags': 'a'}));
}

// Extend the object with event emitter.
util.inherits(Logger, eventEmitter);

Logger.prototype.error = function error(code, message) {
  if (log !== undefined) {
    log.error(message);
  }
}

Logger.prototype.info = function info(code, message) {
  if (log !== undefined) {
    log.info(message);
  }
}

Logger.prototype.debug = function debug(code, message) {
  if (log !== undefined) {
    log.debug(message);
  }
}

// Export the object (exports uses cache, hence singleton).
module.exports = new Logger();