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

    /**
     * Default get request.
     */
    imports.app.get('/api', function (req, res) {
      res.send('Please see documentation about using this api.');
    });

  };


  // Create the API routes using the API object.
  var api = new API();

  // This plugin extends the server plugin and do not provide new services.
  register(null, null);
};
