/**
 * @file
 * This is a wrapper class to handel cron jobs.
 */

// NPM modules.
var CronJob = require('cron').CronJob;

/**
 * Check if screen should be removed from the middleware do to inactivity.
 *
 * @param apikey
 *   The API key to check screens under.
 */
function cleanDeadScreens(self, apikey) {
  "use strict";

  self.cache.membersOfSet('screen:' + apikey, function (err, screens) {
    if (err) {
      console.log(err);
      self.logger.error(err.message);
    }
    else {
      // Loop over screens and build promises array.
      for (var i in screens) {
        var sc = new self.screen(apikey, screens[i]);
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
 * Define the Base object (constructor).
 */
var Jobs = function Jobs(cache, screen, apikeys, logger) {
  "use strict";

  this.cache = cache;
  this.screen = screen;
  this.apikeys = apikeys;
  this.logger = logger;
};

Jobs.prototype.cacheCleanUp = function cacheCleanUp() {
  "use strict";

  var self = this;


  new CronJob('*/5 * * * * *', function() {
    self.apikeys.load().then(
      function (keys) {
        console.log(keys);
        keys = Object.keys(keys);
        for (var i = 0; i < keys.length; i++) {
          console.log(keys[i]);
          cleanDeadScreens(self, keys[i]);
        }
      }, function (error) {
        console.log('test3');
        self.logger.error(error.message);
      }
    );
  }, null, true);
};

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
