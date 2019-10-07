/**
 * @file
 * This is a wrapper class to handel the system logger.
 */

// Node core modules.
var fs = require('fs');
var path = require('path');

// NPM modules.
var winston = require('winston');
var DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Define the Base object (constructor).
 */
var Logger = function Logger(logs) {
  "use strict";

  if (logs.hasOwnProperty('info')) {
    this.infoLog = winston.createLogger({
      level: 'info',
      transports: [
        new DailyRotateFile({
          name: 'info-file',
          filename: path.join(__dirname, '../../' + logs.info),
          level: 'info',
          timestamp: true,
          json: false,
          keep: 30,
          compress: false
        })
      ],
      exitOnError: false
    });
  }

  if (logs.hasOwnProperty('debug')) {
    this.debugLog = winston.createLogger({
      level: 'debug',
      transports: [
        new DailyRotateFile({
          name: 'debug-file',
          filename: path.join(__dirname, '../../' + logs.debug),
          level: 'debug',
          timestamp: true,
          json: false,
          keep: 30,
          compress: false
        })
      ],
      exitOnError: false
    });
  }

  if (logs.hasOwnProperty('error')) {
    this.errorLog = winston.createLogger({
      level: 'error',
      transports: [
        new DailyRotateFile({
          name: 'error-file',
          filename: path.join(__dirname, '../../' + logs.error),
          level: 'error',
          timestamp: true,
          json: false,
          keep: 30,
          compress: false
        })
      ],
      exitOnError: false
    });
  }

  if (logs.hasOwnProperty('socket')) {
    this.socketLog = winston.createLogger({
      level: 'info',
      transports: [
        new DailyRotateFile({
          name: 'socket-file',
          filename: path.join(__dirname, '../../' + logs.socket),
          level: 'socket',
          timestamp: true,
          json: false,
          keep: 30,
          compress: false
        })
      ],
      exitOnError: false
    });
  }
};

/**
 * Log error message.
 *
 * @param message
 *   The message to send to the logger.
 */
Logger.prototype.error = function error(message) {
  "use strict";

  if (this.errorLog !== undefined) {
    this.errorLog.error({
      level: 'error',
      message: message
    });
  }
};

/**
 * Log info message.
 *
 * @param message
 *   The message to send to the logger.
 */
Logger.prototype.info = function info(message) {
  "use strict";

  if (this.infoLog !== undefined) {
    this.infoLog.info({
      level: 'info',
      message: message
    });
  }
};

/**
 * Log debug message.
 *
 * @param message
 *   The message to send to the logger.
 */
Logger.prototype.debug = function debug(message) {
  "use strict";

  if (this.debugLog !== undefined) {
    this.debugLog.debug({
      level: 'debug',
      message: message
    });
  }
};

/**
 * Log socket message.
 *
 * @param message
 *   The message to send to the logger.
 */
Logger.prototype.socket = function socket(message, data) {
  "use strict";

  if (this.socketLog !== undefined) {
    if (data !== undefined) {
      this.socketLog.log({
        level: 'info',
        message: message + ' <-:-> ' + JSON.stringify(data)
      });
    }
    else {
      this.socketLog.log('info', message);
    }
  }
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
