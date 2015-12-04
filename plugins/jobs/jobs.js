/**
 * @file
 * This is a wrapper class to handel cron jobs.
 */

// NPM modules.
var CronJob = require('cron').CronJob;

/**
 * Define the Base object (constructor).
 */
var Jobs = function Jobs(cache, screen, apikeys, logger) {
  "use strict";

  this.cache = cache;
  this.screen = screen;
  this.apikeys = apikeys;
  this.logger = logger;
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

  new CronJob('* * */1 * * *', function() {

    var apikey = '059d9d9c50e0c45b529407b183b6a02f';
    self.apikeys.load().then(
      function (keys) {
        keys = Object.keys(keys);
        for (var i = 0; i < keys.length; i++) {
          cleanDeadScreens(keys[i]);
        }
      }, function (error) {
        self.logger.error(error.message);
      }
    );
  }, null, true);
};

/**
 * Check if screen should be removed from the middleware do to inactivity.
 *
 * @param apikey
 *   The API key to check screens under.
 */
function cleanDeadScreens(apikey) {
  "use strict";

  var self = this;

  self.cache.membersOfSet('screen:' + apikey, function (err, screens) {
    if (err) {
      self.logger.error(err.message);
    }
    else {
      // Loop over screens and build promises array.
      for (var i in screens) {
        var sc = new self.screen(apikey, screenId);
        sc.load().then(
          function (screenObj) {
            var limit = Math.round((new Date()).getTime() / 1000) - 1209600;
            if (screenObj.heartbeat === undefined) {
              screenObj.remove();
            }
            else if (screenObj.heartbeat < limit) {
              screenObj.remove();
            }
          },
          function (error) {
            self.logger.error(error.message);
          }
        );
      }
    }
  });
}

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  var jobs = new Jobs(imports.cache, imports.screen, imports.apikeys, imports.logger);
  jobs.cacheCleanUp();

  // Register the plugin with the system.
  register(null, {
    "jobs": {}
  });
};
