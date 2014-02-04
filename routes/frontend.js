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
exports.activate = function (req, res, jwt, jwt_secret) {
  var activationCode = req.body.activationCode;
  if (activationCode != undefined) {

    // @todo: send request to backend about activation code.
    if (activationCode === 12345) {

      // @todo: store screen information from the backend.
      // @todo: Sign screen information NOT activation code.
      var token = jwt.sign(activationCode, jwt_secret, { expiresInMinutes: 60*24*365 });
      res.json({token: token});
    }
    else {
      // Activation code not accepted.
      res.send(403);
    }
  }
  else {
    // @todo: Send better error code.
    res.send(500);
  }
}
