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

  // Injections objects
  var Channel = imports.channel;
  var Screen = imports.screen;

  /**
   * API Object.
   *
   * @constructor
   */
  var API = function () {

    // Injections.
    var app = imports.app;
    this.app = imports.app;
    this.logger = imports.logger;

    // Ref the object.
    var self = this;

    /**
     * Default get request.
     */
    this.app.get('/api', function (req, res) {
      res.send('Please see documentation about using this api.');
    });

    /**
     * Screen: deactivate.
     */
    this.app.delete('/api/screen/:id', function (req, res) {
      var profile = req.user;

      // Get hold of the screen.

      // Remove the screen.


      res.send(200);
    });

    /**
     * Screen: update.
     */
    this.app.put('/api/screen/:id', function (req, res) {
      var profile = req.user;

      if (req.params.hasOwnProperty('id') && req.body.hasOwnProperty('title')) {
        // Load screen.
        var screen = new Screen(profile.apikey, req.params.id);
        screen.load().then(
          function (obj) {
            // Set new screen properties.
            screen.title = req.body.title;

            // Try to save the screen.
            screen.save().then(
              function () {
                res.send(200);
              },
              function (error) {
                res.send(error.message, 500);
              }
            );
          },
          function (error) {
            res.send(error.message, 500);
          }
        );
      }
      else {
        self.logger.error('API: missing id parameter in update screen.');
        res.send('Missing parameters in update screen.', 500);
      }
    });

    /**
     * Screen: reload.
     */
    this.app.post('/api/screen/:id/reload', function (req, res) {
      var profile = req.user;

      if (req.params.hasOwnProperty('id')) {
        // Load screen.
        var screen = new Screen(profile.apikey, req.params.id);
        screen.load().then(
          function (obj) {
            if (obj.reload()) {
              // Reload event sent, so sent 200 back.
              res.send(200);
            }
            else {
              res.send('Screen connection could not be found.', 503);
            }
          },
          function (error) {
            res.send(error.message, 500);
          }
        );
      }
      else {
        self.logger.error('API: missing id parameter in reload screen.');
        res.send('Missing parameters in reload screen.', 500);
      }
    });

    /**
     * Screen: stats.
     */
    this.app.post('/api/screen/:id/stats', function (req, res) {
      var profile = req.user;

      // Get hold of the screen.

      // Get the screen stats.

      res.send(200);
    });

    /**
     * Channel: remove.
     */
    this.app.delete('/api/channel/:id', function (req, res) {
      var profile = req.user;

      if (req.params.hasOwnProperty('id')) {
        // Try to load channels.
        var channel = new Channel(profile.apikey, req.params.id);
        channel.load().then(
          function (obj) {
            obj.remove();

            // Channel have been load, as we guess that it's removable.
            res.send(200);
          },
          function (error) {
            res.send(error.message, 500);
          }
        );
      }
      else {
        self.logger.error('API: missing id parameter in remove channel.');
        res.send('Missing parameters in remove channel.', 500);
      }
    });

    /**
     * Channel: create/update better known has push.
     */
    app.post('/api/channel/:id', function (req, res) {
      var profile = req.user;

      // Validate basic data structure.
      if (req.params.hasOwnProperty('id') && req.body.hasOwnProperty('data')) {
        // Try to create channel.
        var channel = new Channel(profile.apikey, req.params.id);
        channel.data = req.body.data;
        channel.screens = req.body.screens;

        // Save channel and override if one exists.
        channel.save().then(
          function () {
            // Push content.
            channel.push();

            // Log message.
            self.logger.info('API: channel "' + channel.key + '" pushed.');

            // Send response back.
            res.send(200);
          },
          function (error) {
            res.send(error.message, 500);
          }
        );
      }
      else {
        self.logger.error('API: missing parameters in channel push.');
        res.send('Missing parameters in channel push.', 500);
      }
    });
  };

  // Create the API routes using the API object.
  var api = new API();

  // This plugin extends the server plugin and do not provide new services.
  register(null, null);
};
