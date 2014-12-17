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

    // Injections.
    this.logger = imports.logger;
    this.cache = imports.cache;
    this.apikeys = imports.apikeys;
    this.socket = imports.socket;
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
      var socket = self.socket.get(self.apikey, self.id);
      if (socket) {
        socket.emit('booted', { "statusCode": 404 });
        socket.disconnect();
      }

      // Notify that the screen have been removed.
      deferred.resolve();
    });

    return deferred.promise;
  };

  /**
   * Push data to the screen.
   *
   * @param data
   */
  Screen.prototype.push = function push(data) {
    var self = this;

    // Check that screen is connected.
    var socket = self.socket.get(self.apikey, self.id);
    if (socket) {
      // Send channel/content to the screen.
      socket.emit('channelPush', data);
    }
    else {
      self.logger.info('Screen: content could not be pused to "' + self.key + '" as it is not connected.');
    }
  };

  /**
   * Send channel removed event to the screen.
   *
   * @param channelId
   *   Id of the channel to remove.
   */
  Screen.prototype.removeContent = function removeContent(channelId) {
    var self = this;

    // Check that screen is connected.
    var socket = self.socket.get(self.apikey, self.id);
    if (socket) {
      // Send channel/content to the screen.
      socket.emit('channelRemoved', { "id": channelId });
    }
    else {
      self.logger.info('Screen: content could not be pused to "' + self.key + '" as it is not connected.');
    }
  };

  /**
   * Send reload command to the screen.
   */
  Screen.prototype.reload = function reload() {
    var self = this;

    // Check that screen is connected.
    var socket = self.socket.get(self.apikey, self.id);
    if (socket) {
      // Send reload command to the screen.
      socket.emit('reload');
    }
    else {
      self.logger.info('Screen: could not reload "' + self.key + '" as it is not connected.');
    }
  };

  // This plugin extends the server plugin and do not provide new services.
  register(null, {
    "screen": Screen
  });
};
