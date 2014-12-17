/**
 * Handle screen objects.
 */

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Load promise library.
  var Q = require('q');

  // HTTP request.
  var request = require('request-json');

  var Screen = function Screen(apikey, id) {
    this.apikey = apikey;
    this.id = id;

    this.key = 'screen:' + apikey + ':' + id;

    this.title = undefined;
    this.socket = undefined;

    // Injections.
    this.logger = imports.logger;
    this.cache = imports.cache;
    this.apikeys = imports.apikeys;
  };

  /**
   * Load screen.
   *
   * @returns {*}
   *   Promise that the data will be saved.
   */
  Screen.prototype.load = function load() {
    var self = this;

    var deferred = Q.defer();

    self.cache.get(self.key, function(err, res) {
      if (err) {
        self.logger.error('Screen: redis encountered an error in load.');
        deferred.reject(err);
      }
      else {
        if (res !== null) {
          var data = JSON.parse(res);
          self.title = data.title;

          // Notify that the screen have been loaded.
          deferred.resolve(self);
        }
        else {
          // Ignore self signed certificate.
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

          self.apikeys.get(self.apikey).then(
            function (info) {
              // Call backend to get screen information.
              var client = request.newClient(info.backend);
              client.post('api/screen/get', { "id": self.id }, function(error, response, body) {
                if (!error) {
                  if (response.statusCode === 200) {
                    self.title = body.title;

                    // Notify that the screen have been loaded.
                    deferred.resolve(self);
                  }
                  else {
                    // Error getting screen form backend.
                    deferred.reject(new Error('No 200 code come back from the server.'));
                  }
                }
                else {
                  // Error getting screen form backend.
                  deferred.reject(error);
                }
              });
            },
            function (error) {
              // API key problems.
              deferred.reject(error);
            }
          );
        }
      }
    });

    return deferred.promise;
  };

  /**
   * Save screen to cache.
   *
   * @returns {*}
   *   Promise that the data will be saved.
   */
  Screen.prototype.save = function save() {
    var self = this;

    var deferred = Q.defer();

    // Information to store in redis.
    var data = {
      title: self.title
    };

    imports.cache.set(self.key, JSON.stringify(data), function(err, res) {
      if (err) {
        self.logger.error('Screen: redis encounted an error in save.');
        deferred.reject(err);
      }
      else {
        deferred.resolve();
      }
    });

    return deferred.promise;
  };

  /**
   * Remove screen from cache and kick client.
   *
   * @returns {*}
   *   Promise that the client will be removed.
   */
  Screen.prototype.remove = function remove() {
    var self = this;

    var deferred = Q.defer();

    self.cache.remove(self.key, function(err, res) {
      if (err) {
        self.logger.error('Screen: redis encounted an error in remove.');
        deferred.reject(err);
        return;
      }

      // Inform the client/screen.
      self.socket.emit('booted', { "statusCode": 404 });
      self.socket.disconnect();

      // Notify that the screen have been removed.
      deferred.resolve();
    });

    return deferred.promise;
  };

  Screen.prototype.push = function push(data) {

  };

  Screen.prototype.reload = function reload() {

  };

  // This plugin extends the server plugin and do not provide new services.
  register(null, {
    "screen": Screen
  });
};
