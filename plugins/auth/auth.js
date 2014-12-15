/**
 * @file
 * Added Authentication before using the API.
 */

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Load token library.
  var jwt = require('jsonwebtoken');
  var expressJwt = require('express-jwt');

  // HTTP request.
  var request = require('request-json');

  // Get express app.
  var app = imports.app;

  // Get connected to the logger.
  var logger = imports.logger;

  // We are going to protect /api routes with JWT
  app.use('/api', expressJwt({"secret": options.secret}));

  /**
   * Authentication for API access.
   */
  app.post('/authenticate', function (req, res, next) {
    if (!req.body.hasOwnProperty('apikey')) {
      res.send("API key not found in the request.", 404);
    }
    else {
      // Load keys.
      imports.apikeys.get(req.body.apikey).then(
        function (info) {
          if (info) {
            // Create profile.
            var profile = {
              "role": 'api',
              "name": info.name,
              "apikey": req.body.apikey
            };

            // Default expire.
            var expire = 300;
            if (info.hasOwnProperty('expire')) {
              expire = info.expire;
            }

            // API key accepted, so send back token.
            var token = jwt.sign(profile, options.secret, { "expiresInMinutes": expire});
            res.json({'token': token});
          }
          else {
            res.send('API key could not be validated.', 401);
          }
        },
        function (error) {
          res.send(error.message, 500);
        }
      );
    }
  });

  /**
   * Administration login.
   */
  app.post('/login', function (req, res, next) {
    if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
      res.send("Credentials not found in the request.", 404);
    }
    else {
      if (req.body.username == options.admin.username && req.body.password == options.admin.password) {
        var profile = {
          "role": 'admin'
        };

        // Generate token for access.
        var token = jwt.sign(profile, options.secret, {expiresInMinutes: 60 * 5});
        res.json({
          'token': token
        });
      }
      else {
        res.send('Credentials could not be validated.', 401);
      }
    }
  });

  /**
   * Screen: activate.
   *
   */
  app.post('/screen/activate', function (req, res) {
    var activationCode = req.body.activationCode;
    var server = req.body.server;

    if (activationCode !== undefined) {
      var profile = {
        "role": 'screen',
        "activationCode": activationCode
      };

      // Generate token for access.
      var token = jwt.sign(profile, options.secret);

      // Build json object to send to the backend.
      var data = {
        "activationCode": activationCode,
        "token": token
      };

      // Call backend to get screen information.
      var client = request.newClient(server);
      client.post('api/screen/activate', data, function(error, response, body) {
        if (!error && response.statusCode === 200) {
          // Activation code accepted, so send back the token to the client.
          res.json({ token: token });
        }
        else {
          // Activation failed, so send error message back to the client.
          res.send(error.message, data.statusCode);
        }
      });
    }
    else {
      res.send('Activation code could not be validated.', 401);
    }
  });

  // Register the plugin with the system.
  register(null, {
    'auth': {}
  });
};
