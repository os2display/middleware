/**
* @file
* Node jasmine 2.0 Screen object tests.
*/

describe("Screen object test", function() {
  // Get screen object with rewrite.
  var rewire = require('rewire');
  var screen = rewire('./../lib/screen');

  // Override request.
  screen.__set__('Request', require('./mocks/request.mock'));

  // Create client.
  var client = require('./mocks/client.mock');

  it()
  // Load.

  // Save.

  // Remove.

  // Push.

  // Reload.

});