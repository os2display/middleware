/**
 * @file
 * Added API to handle communicaton with the backend.
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
     * Screen: activate.
     */
    app.post('/api/screen', function (req, res) {

    });

    /**
     * Screen: deactivate.
     */
    app.delete('/api/screen/:id', function (req, res) {

    });

    /**
     * Screen: update.
     */
    app.put('/api/screen/:id', function (req, res) {

    });

    /**
     * Screen: reload.
     */
    app.post('/api/screen/:id/reload', function (req, res) {

    });

    /**
     * Screen: stats.
     */
    app.post('/api/screen/:id/stats', function (req, res) {

    });

    /**
     * Channel: create
     */
    app.post('/api/channel', function (req, res) {

    });

    /**
     * Channel: update
     */
    app.put('/api/channel/:id', function (req, res) {

    });

    /**
     * Channel: remove.
     */
    app.delete('/api/channel/:id', function (req, res) {

    });
  };

  // Create the API routes using the API object.
  var api = new API();

  // This plugin extends the server plugin and do not provide new services.
  register(null, null);
};
