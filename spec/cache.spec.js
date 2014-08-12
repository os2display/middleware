/**
* @file
* Node jasmine 2.0 Cache object tests.
*/

describe("Cache test", function() {

  /**
   * Test the connection.
   */
  describe("Connection - ", function() {
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
  describe("Simple set, get, remove and clear - ", function() {
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
        done();
      });
    });

    // Remove.
    it("Remove value", function(done) {
      cache.remove('jasmine-test', function(err, res) {
        // Returns the number of keys removed.
        expect(err).toBeNull();
        expect(res).toEqual(1);

        // Test that the key have been removed.
        cache.get('jasmine-test', function(err, res) {
          expect(err).toBeNull();
          expect(res).toBeNull();
          done();
        });
      });
    });

    // Cache clear.
    it("Clear cache", function(done) {
      cache.set('jasmine-test', 'test-value', function(err, res) {
        cache.clearAll();

        cache.get('jasmine-test', function(err, res) {
          expect(err).toBeNull();
          expect(res).toBeNull();
          done();
        });
      });
    });
  });

  // Sets
  describe("Sets add, get and remove - ", function() {
    var cache = require('./../lib/cache');
    // Add
    it("Set value", function(done) {
      cache.addSet('jasmine-test', 'test-value-1', function(err, res) {
        expect(err).toBeNull();
        expect(res).toEqual(1);

        cache.addSet('jasmine-test', 'test-value-2', function(err, res) {
          expect(err).toBeNull();
          expect(res).toEqual(1);
          done();
        });
      });
    });

    // Get
    it("Get values (member of set)", function(done) {
      cache.membersOfSet('jasmine-test', function(err, res) {
        expect(err).toBeNull();
        expect(res).toEqual([ 'test-value-2', 'test-value-1' ]);
        done();
      });
    });

    // Remove.
    it("Remove values", function(done) {
      cache.removeSet('jasmine-test', 'test-value-2', function(err, res) {
        // Returns the number of keys removed.
        expect(err).toBeNull();
        expect(res).toEqual(1);

        // Test that the key have been removed.
        cache.membersOfSet('jasmine-test', function(err, res) {
          expect(err).toBeNull();
          expect(res).toEqual([ 'test-value-1' ]);

          // Remove last set value.
          cache.clearAll();
          done();
        });
      });
    });

  });

  // Hash

  // // Set

  // // Get

  // // Get all fields

  // // Get all

  // Clear cache

});