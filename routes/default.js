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
 */
exports.loginCallback = function (req, res, jwt, jwt_secret) {  
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
    res.send(403);
  }
};