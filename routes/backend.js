/**
 * @file
 * Defines the reset API routes used by the back-end.
 */

exports.screenUpdate = function (req, res) {
  res.send(500);
}

exports.screenReload = function (req, res) {
  if (req.body.screenID !== undefined) {
    var Screen = require('../lib/screen');

    // Create new screen object.
    var instance = new Screen(undefined, req.body.screenID);
    instance.load();
    instance.on('loaded', function(data) {
      instance.reload();
      res.send(200);
    });

    instance.on('error', function(data) {
      console.log(data.code + ': ' + data.message);
      res.send(500);
    });
  }
  else {
    res.send(500);
  }
}