/**
 * @file
 * This is a wrapper class to handel cron jobs.
 */

// NPM modules.
var CronJob = require('cron').CronJob;

/**
 * Define the Base object (constructor).
 */
var Jobs = function Jobs(cache, channel) {
  "use strict";

  this.cache = cache;
  this.channel = channel;
  this.Q = require('q');
};

/**
 * Log error message.
 *
 * @param message
 *   The message to send to the logger.
 */
Jobs.prototype.cacheCleanUp = function cacheCleanUp(message) {
  "use strict";

  var self = this;

  new CronJob('*/5 * * * * *', function() {

    //console.log('CRON RUN...')

  }, null, true);
};

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  var jobs = new Jobs(imports.cache, imports.channel);
  jobs.cacheCleanUp();

  // Register the plugin with the system.
  register(null, {
    "jobs": {}
  });
};
