/**
 * @file
 * This is a wrapper class to hande the caching of that from backend and
 * frontend. It uses redis to make the information persistent.
 */

/**
 * Cache object implemented as a singleton module pattern.
 */
var Cache = (function() {

  var eventEmitter = require('events').EventEmitter;
  var util = require('util');

  // Custom modules.
  var config = require('./configuration');

  // Private properties.
  var redis;
  var self;

  /**
   * Define the Base object (constructor).
   */
  var Cache = function() {
    // Set self to the object's this (singleton) to make it available
    // to inner private functions.
    self = this;

    connect();
  }

  // Extend the object with event emitter.
  util.inherits(Cache, eventEmitter);

  /**
   * Connect to redis server.
   */
  function connect() {
    var redisConf = config.get('redis');

    if (redis === undefined) {
      // Connect to redis server.
      redis = require("redis").createClient(redisConf.port, redisConf.host, { 'auth_pass': redisConf.auth });

      // Handle connection errors.
      redis.on('error', function (err) {
        // @todo: Use logger class to log error to file.
        console.log(err);
      });

      // Handle on connected event and select the database.
      redis.on("connect", function (err) {
        if (err) {

        }

        redis.select(redisConf.db, function() {
          if (config.get('debug')) {
            console.log('Connected to redis server at: ' + redisConf.host);
          }

          // Connected and DB selected.
          self.emit('connected', {});
        });
      });
    }
    else {
      // Allready connected and DB is selected.
      self.emit('connected', {});
    }
  }

  /**
   * Disconnect from the cache storage.
   */
  Cache.prototype.disconnect = function disconnect() {
    redis.disconnect();
    redis = undefined;
  }

  /**
   * Clear the cache.
   */
  Cache.prototype.clearAll = function clearAll() {

  }

  /**
   * Set single value into the store.
   *
   * @param key
   *   The key to store the value under.
   * @param value
   *   The value to store.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.set = function set(key, value, callback) {
    // Handle connection event.
    this.once('connected', function () {
      // Set the value into redis.
      redis.set(key, value, callback);
    });

    // Connect.
    connect();
  }

  /**
   * Get single value from the store.
   *
   * @param key
   *   The key to retrive the value for.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.get = function get(key, callback) {
    // Handle connection event.
    this.once('connected', function () {
      // Get value from redis.
      redis.get(key, callback);
    });

    // Connect.
    connect();
  }

  /**
   * Remove single value from the store.
   *
   * @param key
   *   The key to remove.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.remove = function remove(key, callback) {
    // Handle connection event.
    this.once('connected', function () {
      // Remove value from redis.
      redis.del(key, callback);
    });

    // Connect.
    connect();
  }

  /**
   * Add set to the store.
   *
   * @param key
   *   The key to store the value under.
   * @param value
   *   The value to store.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.addSet = function addSet(key, value, callback) {
    // Handle connection event.
    this.once('connected', function () {
      // Remove value from redis.
      redis.sadd(key, value, callback);
    });

    // Connect.
    connect();
  }


  /**
   * Remove set from the store.
   *
   * @param key
   *   The key to remove.
   * @param value
   *   Value to remove from the set.
   */
  Cache.prototype.removeSet = function removeSet(key, value) {
    // Handle connection event.
    this.once('connected', function () {
      // Remove value from redis.
      redis.srem(key, value);
    });

    // Connect.
    connect();
  }

  /**
   * Returns all the members of the set value stored at key.
   *
   * @param key
   *   The key to remove.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   *
   * @return string
   *   The values if found else undefined.
   */
  Cache.prototype.membersOfSet = function membersOfSet(key, callback) {
    // Handle connection event.
    this.once('connected', function () {
      // Remove value from redis.
      redis.smembers(key, callback);
    });

    // Connect.
    connect();
  }

  /**
   * Set hash value into the store.
   *
   * @param key
   *   The key to store the value under.
   * @param hash
   *   The hash to store the value under.
   * @param value
   *   The value to store.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.hashSet = function hashSet(key, hash, value, callback) {
    // Handle connection event.
    this.once('connected', function () {
      // Set the value into redis.
      redis.hset(key, hash, value, callback);
    });

    // Connect.
    connect();
  }

  /**
   * Get the values of all the given hash fields.
   *
   * @param key
   *   The key to fetch values under.
   * @param hashes
   *   The hash vaæues to retrive.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.hashGetAllFields = function hashGetAllFields(key, hashes, callback) {
    // Handle connection event.
    this.once('connected', function () {
      // Set the value into redis.
      redis.hmget(key, hashes, callback);
    });

    // Connect.
    connect();
  }

  /**
   * Get all the fields and values in a hash.
   *
   * @param key
   *   The key to fetch values under.
   * @param callback
   *   Callback funcion to call on completion. It will send two parameters "err" and "res".
   */
  Cache.prototype.hashGetAll = function hashGetAll(key, callback) {
    // Handle connection event.
    this.once('connected', function () {
      // Set the value into redis.
      redis.hgetall(key, hashes, callback);
    });

    // Connect.
    connect();
  }

  // Return the inner object.
  return Cache;
})();

// Export the object (exports uses cache, hence singleton).
module.exports = new Cache();