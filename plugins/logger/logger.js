/**
 * @file
 * This is a wrapper class to handel the system logger.
 */

// Node core modules.
var fs = require('fs');

// NPM modules.
var winston = require('winston');

// Holds the log object.
var log;

/**
 * Define the Base object (constructor).
 */
var Logger = function Logger(logs) {
  "use strict";

  var levels = winston.config.syslog.levels;
  levels['socket'] = 8;
  winston.setLevels(levels);

  this.infoLog = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        name: 'info-file',
        filename: logs.info,
        level: 'info',
        colorize: false
      })
    ],
    exitOnError: false
  });

  this.errorLog = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        name: 'error-file',
        filename: logs.error,
        level: 'error',
        colorize: false
      })
    ],
    exitOnError: false
  });

  this.debugLog = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        name: 'debug-file',
        filename: logs.debug,
        level: 'debug',
        colorize: false
      })
    ],
    exitOnError: false
  });

  this.socketLog = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        name: 'socket-file',
        filename: logs.socket,
        level: 'socket',
        colorize: false
      })
    ],
    exitOnError: false
  });

  this.excepLog = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        name: 'exceptions-file',
        filename: logs.exception,
        handleExceptions: true,
        humanReadableUnhandledException: true
      })
    ],
    exitOnError: false
  });

  this.allLog = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({
        name: 'all-file',
        filename: logs.all,
        maxsize: 5242880, //5MB
        maxFiles: 5,
        json: false,
        level: 'debug',
        colorize: false
      })
    ],
    exitOnError: false
  });

};

/**
 * Log error message.
 *
 * @param message
 *   The message to send to the logger.
 */
Logger.prototype.error = function error(message) {
  "use strict";

  this.errorLog.error(message);
  this.allLog.error(message);
};

/**
 * Log info message.
 *
 * @param message
 *   The message to send to the logger.
 */
Logger.prototype.info = function info(message) {
  "use strict";

  this.infoLog.info(message);
  this.allLog.info(message);
};

/**
 * Log debug message.
 *
 * @param message
 *   The message to send to the logger.
 */
Logger.prototype.debug = function debug(message) {
  "use strict";

  this.debugLog.debug(message);
  this.allLog.debug(message);
};

/**
 * Log socket message.
 *
 * @param message
 *   The message to send to the logger.
 */
Logger.prototype.socket = function socket(message) {
  "use strict";

  this.debugLog.socket(message);
  this.allLog.socket(message);
};

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  var logger = new Logger(options.logs);

  // Register the plugin with the system.
  register(null, {
    "logger": logger
  });
};
