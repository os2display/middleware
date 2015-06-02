/**
 * @file
 * This plugin provides a key/value based cache.
 */

// Core modules.
var eventEmitter = require('events').EventEmitter;
var util = require('util');


// Register the plugin.
module.exports = function (options, imports, register) {
  "use strict";

  /**
   * Define the Base object (constructor).
   */
  var Cache = function(CacheService) {
    // Set cache backend.
    this.CacheService = CacheService;

    // Set current connection
    this.service = undefined;

    // Set logger for the object (other plugin).
    this.logger = imports.logger;
  };

  // Extend the object with event emitter.
  util.inherits(Cache, eventEmitter);

  /**
   * Connect to cache service server.
   */
  function connectCache(self) {
    // Get configuration.
    var config = options.config;

    // Check if connection exists.
    if (self.service === undefined) {
      // Connect to service server.
      self.service = self.CacheService.createClient(config.port, config.host, { 'auth_pass': config.auth });

      // Handle connection errors.
      self.service.on('error', function (err) {
        self.logger.error('Cache connection failed: ' + err.message);
      });

      // Handle on connected event and select the database.
      self.service.on("connect", function (err) {
        if (err) {
          self.logger.error('Cache connect failed: ' + err.message);
        }

        // Select the right database.
        self.service.select(config.db, function() {
          self.logger.info('Connected to cache service server at: ' + config.host);

          // Connected and DB selected.
          self.emit('connected', {});
        });
      });
    }
    else {
      // Already connected and DB is selected.
      self.emit('connected', {});
    }
  }

  /**
   * Connect to the cache storage.
   */
  Cache.prototype.connect = function connect() {
    connectCache(this);
  };

  /**
   * Disconnect from the cache storage.
   */
  Cache.prototype.disconnect = function disconnect() {
    this.service.quit();
    this.service = undefined;
  };

  /**
   * Clear the cache.
   */
  Cache.prototype.clearAll = function clearAll() {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.flushdb();
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Set single value into the store.
   *
   * @param key
   *   The key to store the value under.
   * @param value
   *   The value to store.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.set = function set(key, value, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      // Set the value into service.
      self.service.set(key, value, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Get single value from the store.
   *
   * @param key
   *   The key to retrieve the value for.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.get = function get(key, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      // Get value from service.
      self.service.get(key, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Remove single value from the store.
   *
   * @param key
   *   The key to remove.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.remove = function remove(key, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      // Remove value from service.
      self.service.del(key, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Add set to the store.
   *
   * @param key
   *   The key to store the value under.
   * @param value
   *   The value to store.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.addSet = function addSet(key, value, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.sadd(key, value, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Remove set from the store.
   *
   * @param key
   *   The key to remove.
   * @param value
   *   Value to remove from the set.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.removeSet = function removeSet(key, value, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.srem(key, value, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Returns all the members of the set value stored at key.
   *
   * @param key
   *   The key to lookup.
   * @param callback
   *   Callback funtcion to call on completion. It will send two parameters "err" and "res".
   *
   * @return string
   *   The values if found else undefined.
   */
  Cache.prototype.membersOfSet = function membersOfSet(key, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.smembers(key, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Set hash value into the store.
   *
   * @param key
   *   The key to store the value under.
   * @param field
   *   The hash to store the value under.
   * @param value
   *   The value to store.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.hashSet = function hashSet(key, field, value, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.hset(key, field, value, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Get the values of all the given hash fields.
   *
   * @param key
   *   The key to fetch values under.
   * @param field
   *   The field values to retrieve.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.hashGet = function hashGet(key, field, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.hget(key, field, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Remove hash field.
   *
   * @param key
   *   The key to fetch values under.
   * @param field
   *   The field values to retrieve.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.hashRemove = function hashRemove(key, field, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.hdel(key, field, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Get the values of all the given hash fields.
   *
   * @param key
   *   The key to fetch values under.
   * @param hashes
   *   The hash values to retrieve.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.hashGetAllFields = function hashGetAllFields(key, hashes, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.hmget(key, hashes, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Get all the fields and values in a hash.
   *
   * @param key
   *   The key to fetch values under.
   * @param callback
   *   Callback function to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.hashGetAll = function hashGetAll(key, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      self.service.hgetall(key, callback);
    });

    // Connect.
    connectCache(self);
  };

  /**
   * Set single value into the store.
   *
   * @param key
   *   The key to store the value under.
   * @param value
   *   The value to store.
   * @param expire
   *   The expire in seconds.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.setExpire = function setExpire(key, value, expire, callback) {
    var self = this;

    // Handle connection event.
    self.once('connected', function () {
      // Set the value into service.
      self.service.setex(key, expire, value, callback);
    });

    // Connect.
    connectCache(self);
  };

  // Define the cache service backend.
  var backend = require('redis');

  // Register the plugin with the system.
  register(null, {
    "cache": new Cache(backend)
  });
};
