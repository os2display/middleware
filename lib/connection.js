/**
 * @file
 * Used to keep track of a given connection to a client.
 */

var util = require('util');
var Base = require('./base');

/**
 * Connection object as the module pattern.
 */
var Connection = (function() {

  var Connection = function() {
    // Call base class contructor.
    Base.call(this);

  }

  // Extend the object with event emitter.
  util.inherits(Connection, Base);

  return Connection;
})();

// Export the object.
module.exports = Connection;