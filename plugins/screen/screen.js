/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // HTTP request.
  var request = require('request-json');

  var Screen = function Screen(apikey, id) {
    this.apikey = apikey;
    this.id = id;

    this.key = 'screen:' + apikey + ':' + id;

    this.title = undefined;
    this.socket = undefined;
  };

  Screen.prototype.load = function load() {
    var self = this;

    var deferred = Q.defer();

    imports.cache.get(self.key, function(err, res) {
      if (err) {
        self.logger.error('Scree: redis encounted an error in save.');
        deferred.reject(err);
      }
      else {
        if (res !== null) {
          var data = JSON.parse(res);
          self.id = data.id;
          self.apikey = data.apikey;
          self.title = data.title;

          // Notify that the screen have been loaded.
          deferred.resolve();
        }
        else {
          // Ignore self signed certificate.
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

          imports.apikeys.get(self.apikey).then(
            function (info) {
              // Call backend to get screen information.
              var client = request.newClient(info.backend);
              client.post('api/screen/get', { "id": self.id }, function(error, response, body) {
                if (!error) {
                  if (response.statusCode === 200) {
                    self.title = body.title;

                    // Notify that the screen have been loaded.
                    deferred.resolve();
                  }
                  else {
                    res.send('.', response.statusCode);
                  }
                }
                else {
                  // Screen request failed.
                  res.send(error.message, 500);
                }
              });
            },
            function (error) {
              res.send(error.message, 500);
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
      id: self.id,
      apikey: self.apikey,
      title: self.title
    };

    imports.cache.set(self.key, JSON.stringify(data), function(err, res) {
      if (err) {
        self.logger.error('Scree: redis encounted an error in save.');
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
        self.logger.error('Scree: redis encounted an error in remove.');
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

  Screen.prototype.push = function push() {

  };

  Screen.prototype.reload = function reload() {

  };

  // This plugin extends the server plugin and do not provide new services.
  register(null, {
    "screen": Screen
  });
};
