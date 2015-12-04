/**
 * @file
 * Added API to the administration interface.
 */

/**
 * This object encapsulate the RESET API from the administration interface.
 *
 * @param app
 *   The express Application.
 * @param logger
 *   The event logger.
 * @param apikeys
 *   API key object.
 * @param cache
 *   Cache object.
 * @param Screen
 *   Screen object.
 * @param Channel
 *   Channel object.
 *
 * @constructor
 */
var Admin = function Admin(app, logger, apikeys, cache, Screen, Channel, options) {
  "use strict";

  var self = this;
  this.logger = logger;
  this.cache = cache;

  this.expressJwt = require('express-jwt');
  this.Q = require('q');

  /**
   * Default get request.
   */
  app.get('/api/admin', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      res.send('Please see documentation about using this administration api.');
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Get API keys.
   */
  app.get('/api/admin/keys', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      apikeys.load().then(
        function (keys) {
          res.json(keys);
        }, function (error) {
          res.status(500).send(error.message);
        }
      );
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Get single API key.
   */
  app.get('/api/admin/key/:key', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      // Get info about API keys.
      apikeys.get(req.params.key).then(
        function (info) {
          if (info) {
            res.json(info);
          }
          else {
            res.status(404).send('The API key was not found.');
          }
        }, function (error) {
          res.send(error.message, 500);
        }
      );
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Update API key.
   */
  app.put('/api/admin/key/:key', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      var info = req.body.api;
      var key = req.params.key;

      // Remove key form information.
      delete info.key;

      apikeys.update(key, info).then(
        function (status) {
          res.send('API key "' + key + '" have been updated.');
        },
        function (error) {
          res.status(500).send(error.message);
        }
      );
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Delete API keys.
   */
  app.delete('/api/admin/key/:key', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      var key = req.params.key;

      // Remove API key.
      apikeys.remove(key).then(
        function (status) {
          res.send('API key "' + key + '" have been removed.');
        },
        function (error) {
          res.status(500).send(error.message);
        }
      );
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Add API key.
   */
  app.post('/api/admin/key', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      var info = req.body.api;
      var key = req.body.api.key;

      // Remove key form information.
      delete info.key;

      // Add API key.
      apikeys.add(key, info).then(
        function (status) {
          res.send('API key "' + key + '" have been added.');
        },
        function (error) {
          res.status(500).send(error.message);
        }
      );
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Get all heartbeats.
   */
  app.get('/api/admin/status/heartbeats/:apikey', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      var apikey = req.params.apikey;
      var data = {
        "apikey": apikey,
        "beats": []
      };

      self.cache.membersOfSet('screen:' + apikey, function (err, screens) {
        if (err) {
          self.logger.error(err.message);
        }
        else {
          // Start promise group to load all screens under the api-key.
          self.Q()
            .then(function () {
              var screenPromises = [];

              // Loop over screens and build promises array.
              for (var i in screens) {
                screenPromises.push(loadScreen(apikey, screens[i]));
              }

              return screenPromises;
            })
            .all()
            .then(function (results) {
              data.beats = results;
              res.send(data);
            },
            function (error) {
              res.status(500).send(error.message);
            }
          )
        }
      });
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Helper function to load a screen.
   *
   * @param apikey
   *   API-key for the screen to load.
   * @param screenId
   *   The id of screen to load.
   *
   * @returns {*}
   */
  function loadScreen(apikey, screenId) {
    var deferred = self.Q.defer();

    var screen = new Screen(apikey, screenId);
    screen.load().then(
      function (screenObj) {
        deferred.resolve({
          "id": screenObj.id,
          "title": screenObj.title,
          "heartbeat": screenObj.heartbeat
        })
      },
      function (error) {
        self.logger.error(error.message);
        deferred.reject(error.message);
      }
    );

    return deferred.promise;
  }

  /**
   * Get status for all channels.
   */
  app.get('/api/admin/status/channels/:apikey', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      var apikey = req.params.apikey;
      var data = {
        "apikey": apikey,
        "channels": []
      };

      self.cache.membersOfSet('channel:' + apikey, function (err, channels) {
        if (err) {
          self.logger.error(err.message);
        }
        else {
          // Start promise group to load all channels under the api-key.
          self.Q()
            .then(function () {
              var channelPromises = [];

              // Loop over channels and build promises array.
              for (var i in channels) {
                channelPromises.push(loadChannel(apikey, channels[i]));
              }

              return channelPromises;
            })
            .all()
            .then(function (results) {
              data.channels = results;
              res.send(data);
            },
            function (error) {
              res.status(500).send(error.message);
            }
          )
        }
      });
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Helper function to load a channel
   *
   * @param apikey
   *   API-key for the channel to load.
   * @param channelId
   *   The ID of the channel to load.
   *
   * @returns {*}
   */
  function loadChannel(apikey, channelId) {
    var deferred = self.Q.defer();

    var channel = new Channel(apikey, channelId);
    channel.load().then(
      function (channelObj) {
        deferred.resolve({
          "id": channelObj.id,
          "title": channelObj.title,
          "screens": channelObj.screens
        });
      },
      function (error) {
        self.logger.error(error.message);
        deferred.reject(error.message);
      }
    );

    return deferred.promise;
  }

  /**
   * Reload screen.
   */
  app.get('/api/admin/:apikey/screen/:id/reload', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      var screen = new Screen(req.params.apikey, req.params.id);
      screen.reload();

      res.sendStatus(200);
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Logout screen.
   */
  app.get('/api/admin/:apikey/screen/:id/logout', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      var screen = new Screen(req.params.apikey, req.params.id. req.user.activationCode);
      screen.remove().then(
        function () {
          res.sendStatus(200);
        },
        function () {
          res.sendStatus(500);
        }
      );
    }
    else {
      res.status(401).send('You do not have the right role.');
    }
  });
};


/**
 * Validate that the role is admin.
 *
 * @param req
 *   Express request object.
 */
Admin.prototype.validateCall = function validateCall(req) {
  "use strict";

  return (req.hasOwnProperty('user')) && (req.user.role === 'admin');
};

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Create the API routes using the API object.
  var admin = new Admin(imports.app, imports.logger, imports.apikeys, imports.cache, imports.screen, imports.channel, options);

  // This plugin extends the server plugin and do not provide new services.
  register(null, null);
};
