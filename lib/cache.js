/**
 * @file
 * This is a wrapper class to hande the caching of that from backend and
 * frontend. It uses redis to make the information persistent.
 */

/**
 * Cache object implemented as a singleton module pattern.
 */
var Cache = (function() {

  // Node core modules.
  var eventEmitter = require('events').EventEmitter;
  var util = require('util');

  // Custom modules.
  var config = require('./configuration');

  var redis;
  var connected = false;

  /**
   * Connect to redis server.
   */
  function connect() {
    var redisConf = config.get('redis');

    if (redis === undefined) {
      // Handle connection errors.
      redis.on('error', function (err) {
        // @todo: Use logger class to log error to file.
        console.log(err);
      });

      // Handle on connected event and select the database.
      redis.on("connect", function (err) {
        redis.select(redisConf.db, function() {
          if (config.get('debug')) {
            console.log('Connected to redis server at: ' + redisConf.host);
          }

          // Connected and DB selected.
          this.emit('connected', {});
        });
      });

      // Connect to redis server.
      redis = require("redis").createClient(redisConf.port, redisConf.host, { 'auth_pass': redisConf.auth });
    }
    else {
      // Allready connected and DB is selected.
      this.emit('connected', {});
    }
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
  this.set = function set(key, value, callback) {
    // Handle connection event.
    this.on('connected', function () {
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
  this.get = function get(key, callback) {
    // Handle connection event.
    this.on('connected', function () {
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
  this.remove = function remove(key, callback) {
    // Handle connection event.
    this.on('connected', function () {
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
  this.addSet = function addSet(key, value, callback) {
    // Handle connection event.
    this.on('connected', function () {
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
  this.removeSet = function removeSet(key, value) {
    // Handle connection event.
    this.on('connected', function () {
      // Remove value from redis.
      redis.srem(key, value);
    });

    // Connect.
    connect();
  }


  // Extend the object with event emitter.
  util.inherits(Cache, eventEmitter);
});

// Export the object (exports uses cache, hence singleton).
module.exports = new Cache();