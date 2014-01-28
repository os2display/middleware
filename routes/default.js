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
  // HERE A CALL TO THE BACKEND TO VERIFY THE USER SHOULD BE PERFROMED
  var profile = {
    username: req.body.username,
    password: req.body.password
  };

  // We are sending the profile inside the token
  var token = jwt.sign(profile, jwt_secret, { expiresInMinutes: 60*5 });

  res.json({token: token});
};