/**
 * @file
 * Routes used by the client side off the proxy.
 */

// Load token library.
var jwt = require('jsonwebtoken');

/**
 * Checks that the activation code given is valided.
 *
 * If the code is valided an sign token is returned that can be
 * used to establish the socket connection.
 */
exports.activate = function (req, res, jwt_secret) {
  var activationCode = req.body.activationCode;

  if (activationCode != undefined) {
    // Create token.
    var token = jwt.sign(activationCode, jwt_secret);

    // Call backend to get screen information.
    var Request = require('../lib/request');
    var request = new Request();
    request.send('/api/screen/activate', {
      activationCode: activationCode,
      token: token
    });

    request.on('completed', function(data) {
      // Send valided token to the frontend.
      res.json({ token: token });
    });

    request.on('error', function(data) {
      // Error in the request send http code.
      res.send(data.statusCode);
    });
  }
  else {
    var Log = require('log')
    var logger = new Log('info', fs.createWriteStream(config.get('log'), {'flags': 'a'}));
    logger.error('Activation code was not found.');
    res.send(500);
  }
}
