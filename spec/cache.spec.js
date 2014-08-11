/**
* @file
* Node jasmine 2.0 Cache object tests.
*/

describe("Cache test", function() {

  /**
   * Test the connection.
   */
  describe("Connection", function() {
    var originalTimeout;
    var cache;

    beforeEach(function() {
      cache = require('./../lib/cache');
      cache.clearAll();

      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
    });

    it("Create connection", function(done) {
      cache.once('connected', function(data) {
        // Try to get value to verify connection.
        cache.get('jasmine-test', function(err, res) {
          expect(err).toBeNull();
          expect(res).toBeNull();
        });
        done();
      });
    });

    it("Destrory connection", function(done) {
      cache.disconnect();
      done();
    });

    afterEach(function() {
      jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
    });
  });

  /**
   * Test simple string set and get methods.
   */
  describe("Simple set and get", function() {
    var cache = require('./../lib/cache');

    // Set.
    it("Set value", function(done) {
      cache.set('jasmine-test', 'test-value', function(err, res) {
        expect(err).toBeNull();
        expect(res).toEqual('OK');
        done();
      });
    });

    // Get.
    it("Get value", function(done) {
      cache.get('jasmine-test', function(err, res) {
        expect(err).toBeNull();
        expect(res).toEqual('test-value');

        // Clean up.
        cache.clearAll();
        done();
      });
    });
  });

  // Remove.

  // Sets

  // // Add

  // // Get

  // // Member of

  // Hash

  // // Set

  // // Get

  // // Get all fields

  // // Get all

  // Clear cache

});