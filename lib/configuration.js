/**
 * @file
 * This is a wrapper class to hande the configuation loaded from config.json.
 */

/**
 * Configuration object implemented as a singleton module pattern.
 */
var Configuration = (function() {

  var nconf = require('nconf');
  var loaded = false;
  var file = 'config.json';

  /**
   * Load configutation file from disk.
   *
   * @private
   */
  function load() {
    if (!loaded) {
      console.log('loaded');
      nconf.file({ "file": file });
      loaded = true;
    }
  }

  /**
   * Get configuration value.
   *
   * @param property
   *   Get configutation with the name given.
   *
   * @return
   *   The value of the configuration option.
   */
  this.get = function get(property) {
    return nconf.get(property);
  }

  // Ensure that the configutation is loaded.
  load();
});

// Export the object (exports uses cache, hence singleton).
module.exports = new Configuration();