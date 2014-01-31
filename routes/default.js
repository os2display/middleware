/**
 * @file
 * Default routes.
 */

var jwt = require('jsonwebtoken');

/**
 * Index page (/).
 */
exports.index = function (req, res) {
  res.render('index', { title: 'Infostander' });
};

/**
 * Login callback (/login)
 *
 * The maintenance login page, used to get token an socket auth 
 * token. Which can be used to pull proxy status information.
 */
exports.login = function (req, res, jwt, jwt_secret) {
  var profile = {
    username: req.body.username,
    password: req.body.password
  };

  // HERE A CALL TO THE BACKEND TO VERIFY THE USER SHOULD BE PERFROMED
  if (profile.username == 'test' && profile.password == 'password') {
	// We are sending the profile inside the token
    var token = jwt.sign(profile, jwt_secret, { expiresInMinutes: 60*24*365 });
    res.json({token: token});
  }
  else {
    // Access denied.
    res.send(403);
  }
};

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

exports.pushScreens = function (req, res) {
  res.send(500);
}
