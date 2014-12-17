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
    this.data = undefined;
    this.screens = undefined;

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
          self.data = data.data;
          self.screens = data.screens;

          // Notify that the channel have been loaded.
          deferred.resolve();
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
      "data": self.data,
      "screens": self.screens
    };

    imports.cache.set(self.key, JSON.stringify(data), function(err, res) {
      if (err) {
        self.logger.error('Channel: redis encounted an error in save.');
        deferred.reject(err);
      }
      else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  };

  /**
   * Remove channel information from cache.
   *
   * @returns {*}
   *   Promise that the data will be saved.
   */
  Channel.prototype.remove = function remove() {
    var self = this;

    var deferred = Q.defer();

    self.cache.del(self.key, function(err, res) {
      if (err) {
        self.logger.error('Channel: redis encounted an error in save.');
        deferred.reject(err);
      }
      else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  };

  /**
   *
   * @returns {*}
   *   Promise that the data will be saved.
   */
  Channel.prototype.push = function push() {
    var self = this;

    var deferred = Q.defer();

    if (self.data !== undefined && self.screens !== undefined) {
      // Loop over screens.
      for (var screenID in self.screens) {
        // Load screen.
        var screen = new Screen(self.apikey, screenID);
        screen.load().then(
          function (obj) {
            // Ask screen to push content.
            obj.push(self.data);
          },
          function (error) {
            self.logger.error('Channel: screen load failed "' + error.message + '"');
          }
        );

        // Always send resolved and only log errors above.
        deferred.resolve();
      }
    }
    else {
      self.logger.error('Channel: push failed as it did not contain any information.');
      deferred.reject(new Error('Channel did not contain any information.'));
    }

    return deferred.promise;
  };

  /**
   *
   */
  Channel.prototype.hasScreen = function hasScreen() {

  };


  // This plugin extends the server plugin and do not provide new services.
  register(null, {
    "channel": Channel
  });
};
