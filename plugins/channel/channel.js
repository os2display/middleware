/**
 * Handle channel objects.
 */

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  var Channel = function Channel(apikey, id) {
    this.apikey = apikey;
    this.id = id;

    this.key = 'channel:' + apikey + ':' + id;


    // Injections.
    this.logger = imports.logger;
    this.cache = imports.cache;
    this.apikeys = imports.apikeys;
  };

  // This plugin extends the server plugin and do not provide new services.
  register(null, {
    "channel": Channel
  });
};
