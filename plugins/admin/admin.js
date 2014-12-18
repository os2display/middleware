/**
 * @file
 * Added API to the administration interface.
 */

/**
 * This object encapsulate the RESET API.
 *
 * @param app
 * @param logger
 * @param apikeys
 *
 * @constructor
 */
var Admin = function Admin(app, logger, apikeys) {
  "use strict";

  var self = this;
  this.logger = logger;

  /**
   * Default get request.
   */
  app.get('/api/admin', function (req, res) {
    if (self.validateCall(req)) {
      res.send('Please see documentation about using this administration api.');
    }
    else {
      res.send('You do not have the right role.', 401);
    }
  });

  /**
   * Get API keys.
   */
  app.get('/api/admin/keys', function (req, res) {
    if (self.validateCall(req)) {
      apikeys.load().then(
        function (keys) {
          res.json(keys);
        }, function (error) {
          res.send(error.message, 500);
        }
      );
    }
    else {
      res.send('You do not have the right role.', 401);
    }
  });

  /**
   * Get single API key.
   */
  app.get('/api/admin/key/:key', function (req, res) {
    if (self.validateCall(req)) {
      // Get info about API keys.
      apikeys.get(req.params.key).then(
        function (info) {
          if (info) {
            res.json(info);
          }
          else {
            res.send('The API key was not found.', 404);
          }
        }, function (error) {
          res.send(error.message, 500);
        }
      );
    }
    else {
      res.send('You do not have the right role.', 401);
    }
  });

  /**
   * Update API key.
   */
  app.put('/api/admin/key/:key', function (req, res) {
    if (self.validateCall(req)) {
      var info = req.body.api;
      var key = req.params.key;

      // Remove key form information.
      delete info.key;

      apikeys.update(key, info).then(
        function (status) {
          res.send('API key "' + key + '" have been updated.', 200);
        },
        function (error) {
          res.send(error.message, 500);
        }
      );
    }
    else {
      res.send('You do not have the right role.', 401);
    }
  });

  /**
   * Delete API keys.
   */
  app.delete('/api/admin/key/:key', function (req, res) {
    if (self.validateCall(req)) {
      var key = req.params.key;

      // Remove API key.
      apikeys.remove(key).then(
        function (status) {
          res.send('API key "' + key + '" have been removed.', 200);
        },
        function (error) {
          res.send(error.message, 500);
        }
      );
    }
    else {
      res.send('You do not have the right role.', 401);
    }
  });

  /**
   * Add API key.
   */
  app.post('/api/admin/key', function (req, res) {
    if (self.validateCall(req)) {
      var info = req.body.api;
      var key = req.body.api.key;

      // Remove key form information.
      delete info.key;

      // Add API key.
      apikeys.add(key, info).then(
        function (status) {
          res.send('API key "' + key + '" have been added.', 200);
        },
        function (error) {
          res.send(error.message, 500);
        }
      );
    }
    else {
      res.send('You do not have the right role.', 401);
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
  var admin = new Admin(imports.app, imports.logger, imports.apikeys);

  // This plugin extends the server plugin and do not provide new services.
  register(null, null);
};
