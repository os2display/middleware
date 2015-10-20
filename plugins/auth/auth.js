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

  /**
   * Authentication for API access.
   */
  app.post('/authenticate', function (req, res) {
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
            var token = jwt.sign(profile, options.secret, { "expiresIn": expire});
            res.json({'token': token});
          }
          else {
            res.status(401).send('API key could not be validated.');
          }
        },
        function (error) {
          res.status(500).send(error.message);
        }
      );
    }
  });

  /**
   * Administration login.
   */
  app.post('/login', function (req, res, next) {
    if (!req.body.hasOwnProperty('username') || !req.body.hasOwnProperty('password')) {
      res.status(404).send("Credentials not found in the request.");
    }
    else {
      if (req.body.username == options.admin.username && req.body.password == options.admin.password) {
        var profile = {
          "role": 'admin'
        };

        // Generate token for access.
        var token = jwt.sign(profile, options.secret, {expiresIn: 60 * 60 * 5});
        res.json({
          'token': token
        });
      }
      else {
        res.status(401).send('Credentials could not be validated.');
      }
    }
  });

  /**
   * Screen: activate.
   */
  app.post('/screen/activate', function (req, res) {
    var activationCode = req.body.activationCode;
    var apikey = req.body.apikey;

    if (activationCode !== undefined) {
      // Build json object to send to the backend.
      var data = {
        "activationCode": activationCode
      };

      // Check if activation code is in use or has been used.
      imports.cache.hashGet('activation:' + apikey, activationCode, function(error, value) {
        if (value !== null) {
          // Generate token to ensure access.
          var token = jwt.sign({
            "role": 'kicker',
            "activationCode": activationCode,
            "apikey": apikey,
            "screenID": value
          }, options.secret);


          // Activation code have been used before.
          res.status(409).send({
            "token": token,
            "message": 'Activation code is used before.\n\nIf you continue we will logout the other screen currently connected with that code.\n\nDo you want to logout the other screens?'
          });
        }
        else {
          // Ignore self signed certificate.
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

          // Load API key information to get backend url.
          imports.apikeys.get(apikey).then(
            function (info) {
              // Call backend to get screen information.
              var client = request.createClient(info.backend);
              client.post('api/screen/activate', data, function(error, response, body) {
                if (!error) {
                  if (response.statusCode === 200) {
                    // JWT profile.
                    var profile = {
                      "role": 'screen',
                      "activationCode": activationCode,
                      "apikey": apikey,
                      "screenID": body.id,
                      "screenTitle": body.title
                    };

                    // Store the activation code in a hash table use to ensure that no more than one screen exists for that
                    // activation code.
                    imports.cache.hashSet('activation:' + apikey, activationCode, body.id, function(error, res) {
                      if (error) {
                        imports.logger.error('Auth: Activation code hash could not be updated.');
                      }
                    });

                    // Generate token for access.
                    var token = jwt.sign(profile, options.secret);

                    // Activation code accepted, so send back the token to the client.
                    res.json({token: token});
                  }
                  else {
                    res.status(response.statusCode).send('Activation code could not be validated.');
                  }
                }
                else {
                  // Activation failed, so send error message back to the client.
                  res.status(500).send(error.message);
                }
              });
            },
            function (error) {
              res.status(500).send(error.message);
            }
          );
        }
      });

    }
    else {
      res.status(401).send('Activation code could not be validated.');
    }
  });

  /**
   * Screen: activate.
   */
  app.post('/screen/kick', expressJwt({"secret": options.secret}), function (req, res) {
    // Check that the role is correct (kicker) is a role given in the activation code above.
    if (req.user.role === 'kicker') {
      // Load screen.
      var screen = new imports.screen(req.user.apikey, req.user.screenID, req.user.activationCode);
      screen.remove().then(
        function () {
          res.sendStatus(200);
        },
        function (error) {
          imports.logger.error('Auth: ' + error.message);
        }
      );
    }
  });

    // Register the plugin with the system.
  register(null, {
    'auth': {}
  });
};
