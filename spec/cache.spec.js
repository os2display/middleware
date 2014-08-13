/**
* @file
* Node jasmine 2.0 Cache object tests.
*/

describe("Cache test", function() {
  // Load cache module and override its configuration.
  var rewire = require('rewire');
  var cache = rewire('./../lib/cache');
  cache.__set__('config', require('./mocks/configuration.mock'));

  // Ensure that the test storage is empty.
  cache.clearAll();

  /**
   * Test the connection.
   */
  describe("Connection - ", function() {
    var originalTimeout;

    beforeEach(function() {
      originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
      jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
    });

    it("Create connection", function(done) {
      cache.connect();
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

  /**
   * Test sets with set, membersof and remove.
   */
  describe("Sets add, get and remove - ", function() {
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

  /**
   * Test hash tables with add, get and remove.
   */
  describe("Hashes add, get and remove - ", function() {
    // Set
    it("Set values", function(done) {
      cache.hashSet('jasmine-test', '1234', 'value 1', function(err, res) {
        expect(err).toBeNull();
        expect(res).toEqual(1);
        done();
      });
    });

    // Get all fields
    it("Get fields value", function(done) {
      cache.hashSet('jasmine-test', '4321', 'value 2', function(err, res) {
        cache.hashSet('jasmine-test', '5412', 'value 3', function(err, res) {
          cache.hashGetAllFields('jasmine-test', ['1234', '4321'], function(err, res) {
            expect(err).toBeNull();
            expect(res).toEqual([ 'value 1', 'value 2' ]);
            done();
          });
        });
      });
    });

    // Get all
    it("Get fields value", function(done) {
      cache.hashGetAll('jasmine-test', function(err, res) {
        expect(err).toBeNull();
        expect(res).toEqual({ 1234 : 'value 1', 4321 : 'value 2', 5412 : 'value 3' });
        done();
      });
    });

    // Remove test hash.
    it("Remove hash", function(done) {
      cache.remove('jasmine-test', function(err, res) {
          // Returns the number of keys removed.
          expect(err).toBeNull();
          expect(res).toEqual(1);
          done();
      });
    });
  });
});
