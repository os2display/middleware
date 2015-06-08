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
          var len = screens.length;

          // Check if any screens are active on for the api key.
          if (!len) {
            res.send(data);
          }

          // Loop over screens.
          for (var i in screens) {
            var screen = new Screen(apikey, screens[i]);
            /// THEN ALL NEEDED HERE.
            screen.load().then(
              function (screenObj) {
                data.beats.push({
                  "id": screenObj.id,
                  "title": screenObj.title,
                  "heartbeat": screenObj.heartbeat
                });

                // When to return the data.
                if ((Number(i) + 1) === len) {
                  // All screens have been loaded.
                  res.send(data);
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
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

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
          var len = channels.length;

          // Check if any channels are available for the api key.
          if (!len) {
            res.send(data);
          }

          // Loop over channels.
          for (var i in channels) {
            var channel = new Channel(apikey, channels[i]);
            channel.load().then(
              function (channelObj) {
                data.channels.push({
                  "id": channelObj.id,
                  "title": channelObj.title,
                  "screens": channelObj.screens.length
                });

                // When to return the data.
                if ((Number(i) + 1) === len) {
                  // All channels have been loaded.
                  res.send(data);
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
    else {
      res.status(401).send('You do not have the right role.');
    }
  });

  /**
   * Reload screen.
   */
  app.get('/api/admin/:apikey/screen/:id/reload', this.expressJwt({"secret": options.secret}), function (req, res) {
    if (self.validateCall(req)) {
      var apikey = req.params.apikey;
      var screenId = req.params.id;

      var screen = new Screen(apikey, screenId);
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
      var apikey = req.params.apikey;
      var screenId = req.params.id;

      var screen = new Screen(apikey, screenId);
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
