/**
 * @file
 * Added API to handle restful communication.
 */

var Q = require('q');

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  var API = function () {

    var app = imports.app;

    /**
     * Default get request.
     */
    app.get('/api', function (req, res) {
      res.send('Please see documentation about using this api.');
    });

    /**
     * Screen: deactivate.
     */
    app.delete('/api/screen/:id', function (req, res) {
      var profile = req.user;

      // Get hold of the screen.

      // Remove the screen.


      res.send(200);
    });

    /**
     * Screen: update.
     */
    app.put('/api/screen/:id', function (req, res) {
      var profile = req.user;

      // Get hold of the screen.

      // Update the screen.

      res.send(200);
    });

    /**
     * Screen: reload.
     */
    app.post('/api/screen/:id/reload', function (req, res) {
      var profile = req.user;

      // Get hold of the screen.

      // Reload the screen.

      res.send(200);
    });

    /**
     * Screen: stats.
     */
    app.post('/api/screen/:id/stats', function (req, res) {
      var profile = req.user;

      // Get hold of the screen.

      // Get the screen stats.

      res.send(200);
    });

    /**
     * Channel: create
     */
    app.post('/api/channel', function (req, res) {
      var profile = req.user;

      res.send(200);
    });

    /**
     * Channel: update
     */
    app.put('/api/channel/:id', function (req, res) {
      var profile = req.user;

      res.send(200);
    });

    /**
     * Channel: remove.
     */
    app.delete('/api/channel/:id', function (req, res) {
      var profile = req.user;

      res.send(200);
    });

    /**
     * Channel: remove.
     */
    app.post('/api/channel/:id/push', function (req, res) {
      var profile = req.user;

      res.send(200);
    });
  };

  // Create the API routes using the API object.
  var api = new API();

  // This plugin extends the server plugin and do not provide new services.
  register(null, null);
};
