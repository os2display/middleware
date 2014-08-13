/**
* @file
* Node jasmine 2.0 Logger object tests.
*/

describe("Logger object test", function() {
  // Load the logger with rewrite.
  var rewire = require('rewire');
  var logger = rewire('./../lib/logger');

  // Override file log.
  logger.__set__('log', {
    error: function error(message) {},
    info: function info(message) {},
    debug: function debug(message) {}
  });

  describe("Error, info and debug - ", function() {
    // Error.
    it("Error message", function(done) {
      logger.once('error', function(data) {
        expect(data.code).toEqual(500);
        expect(data.message).toEqual('Error message 1');
        done();
      });
      logger.error(500, 'Error message 1')
    });

    // Info.
    it("Info message", function(done) {
      logger.once('info', function(data) {
        expect(data.code).toEqual(500);
        expect(data.message).toEqual('Info message 1');
        done();
      });
      logger.info(500, 'Info message 1')
    });

    // Debug.
    it("Debug message", function(done) {
      logger.once('debug', function(data) {
        expect(data.code).toEqual(500);
        expect(data.message).toEqual('Debug message 1');
        done();
      });
      logger.debug(500, 'Debug message 1')
    });
  });
});