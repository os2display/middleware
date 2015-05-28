/**
 * Handle channel objects.
 */

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Load promise library.
  var Q = require('q');

  // Injections object.
  var Screen = imports.screen;

  var Channel = function Channel(apikey, id) {
    this.apikey = apikey;
    this.id = id;

    this.key = 'channel:' + apikey + ':' + id;

    // Channel properties.
    this.title = undefined;
    this.data = undefined;
    this.screens = undefined;
    this.regions = undefined;

    // Injections.
    this.logger = imports.logger;
    this.cache = imports.cache;
    this.apikeys = imports.apikeys;
  };

  /**
   * Load channel.
   *
   * @returns {*}
   *   Promise that the data will be saved.
   */
  Channel.prototype.load = function load() {
    var self = this;

    var deferred = Q.defer();

    self.cache.get(self.key, function(err, res) {
      if (err) {
        self.logger.error('Channel: redis encountered an error in load.');
        deferred.reject(err);
      }
      else {
        if (res !== null) {
          var data = JSON.parse(res);
          self.title = data.title;
          self.data = data.data;
          self.screens = data.screens;
          self.regions = data.regions;

          // Notify that the channel have been loaded.
          deferred.resolve(self);
        }
        else {
          self.logger.error('Channel: not found in cache (' + self.key + ') in load');
          deferred.reject();
        }
      }
    });

    return deferred.promise;
  };

  /**
   * Save channel information to cache.
   *
   * @returns {*}
   *   Promise that the data will be saved.
   */
  Channel.prototype.save = function save() {
    var self = this;

    var deferred = Q.defer();

    // Information to store in redis.
    var data = {
      "title": self.title,
      "data": self.data,
      "screens": self.screens,
      "regions": self.regions
    };

    self.cache.set(self.key, JSON.stringify(data), function(err, res) {
      if (err) {
        self.logger.error('Channel: redis encounted an error in save.');
        deferred.reject(err);
      }
      else {
        // Add channel id, so channels can be searched.
        self.cache.addSet('channel:' + self.apikey, self.id, function(err, res) {
          if (err) {
            self.logger.error('Channel: redis encounted an error in save set.');
            deferred.reject(err);
          }
          else {
            deferred.resolve();
          }
        });
      }
    });

    return deferred.promise;
  };

  /**
   * Remove channel information from cache.
   */
  Channel.prototype.remove = function remove() {
    var self = this;

    if (self.screens !== undefined) {
      // Remove cached channel.
      self.cache.del(self.key, function (err, res) {
        if (err) {
          self.logger.error('Channel: redis encounted an error in del channel.');
        }
        else {
          // Remove channel from channel set.
          self.cache.removeSet('channel:' + self.apikey, self.id, function(err, res) {
            if (err) {
              self.logger.error('Channel: redis encounted an error in del channel set.');
            }

            // We have to continue even if there is an error above, as the
            // cached channel have been removed. Find screens that displays the
            // channel and send removed event.
            for (var i in self.screens) {
              var screenID = self.screens[i];
              // Load screen.
              var screen = new Screen(self.apikey, screenID);
              screen.load().then(
                function (obj) {
                  // Ask screen to push content.
                  obj.removeChannel(self.id);
                },
                function (error) {
                  self.logger.error('Channel: screen load failed "' + error.message + '"');
                }
              );
            }
          });
        }
      });
    }
    else {
      self.logger.error('Channel: remove failed as it did not contain any screens.');
    }
  };

  /**
   * Push channel content to screens.
   */
  Channel.prototype.push = function push() {
    var self = this;

    if (self.data !== undefined && self.screens !== undefined) {
      // Loop over screens.
      for (var i in self.screens) {
        var screenID = self.screens[i];
        // Load screen.
        var screen = new Screen(self.apikey, screenID);
        screen.load().then(
          function (obj) {
            // Find which regions of the screen to push to.
            var regions = [];
            if (self.regions !== undefined) {
              for (var j = 0; j < self.regions.length; j++) {
                if (self.regions[j].screen === obj.id) {
                  regions.push(self.regions[j].region);
                }
              }
            }

            // Ask screen to push content.
            obj.push({
              "regions": regions,
              "data": self.data
            });
          },
          function (error) {
            self.logger.error('Channel: screen load failed "' + error.message + '"');
          }
        );
      }
    }
    else {
      self.logger.error('Channel: push failed as it did not contain any information.');
    }
  };

  /**
   * Checks if the channel has content for a given screen.
   *
   * @param screenID
   *   Id of the screen to search for.
   * @returns {boolean}
   *   True if screen was found else false.
   */
  Channel.prototype.hasScreen = function hasScreen(screenID) {
    var self = this;
    for (var i in self.screens) {
      if (self.screens[i] === screenID) {
        return true;
      }
    }

    return false;
  };

  // This plugin extends the server plugin and do not provide new services.
  register(null, {
    "channel": Channel
  });
};
