/**
 * @file
 * This is a wrapper class to hande the caching of that from backend and
 * frontend. It uses service to make the information persistent.
 */

/**
 * Cache object implemented as a singleton module pattern.
 */

// Core modules.
var eventEmitter = require('events').EventEmitter;
var util = require('util');

// Custom modules.
var config = require('./configuration');
var backend = require('redis');

// Private properties.
var service;
var self;

/**
 * Define the Base object (constructor).
 */
var Cache = function(CacheService) {
  // Set self to the object's this (singleton) to make it available
  // to inner private functions.
  self = this;

  this.CacheService = CacheService;
}

// Extend the object with event emitter.
util.inherits(Cache, eventEmitter);

/**
 * Connect to cache service server.
 */
function connectCache() {
  var cacheConf = config.get('cache');

  if (service === undefined) {
    // Connect to service server.
    service = self.CacheService.createClient(cacheConf.port, cacheConf.host, { 'auth_pass': cacheConf.auth });

    // Handle connection errors.
    service.on('error', function (err) {
      // @todo: Use logger class to log error to file.
      console.log(err);
    });

    // Handle on connected event and select the database.
    service.on("connect", function (err) {
      if (err) {

      }

      service.select(cacheConf.db, function() {
        if (config.get('debug')) {
          console.log('Connected to cache service server at: ' + cacheConf.host);
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
 * Connect to the cache storage.
 */
Cache.prototype.connect = function connect() {
  connectCache();
}

/**
 * Disconnect from the cache storage.
 */
Cache.prototype.disconnect = function disconnect() {
  service.quit();
  service = undefined;
}

/**
 * Clear the cache.
 */
Cache.prototype.clearAll = function clearAll() {
  // Handle connection event.
  this.once('connected', function () {
    service.flushdb();
  });

  // Connect.
  connectCache();
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
    // Set the value into service.
    service.set(key, value, callback);
  });

  // Connect.
  connectCache();
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
    // Get value from service.
    service.get(key, callback);
  });

  // Connect.
  connectCache();
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
    // Remove value from service.
    service.del(key, callback);
  });

  // Connect.
  connectCache();
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
    service.sadd(key, value, callback);
  });

  // Connect.
  connectCache();
}

/**
 * Remove set from the store.
 *
 * @param key
 *   The key to remove.
 * @param value
 *   Value to remove from the set.
 */
Cache.prototype.removeSet = function removeSet(key, value, callback) {
  // Handle connection event.
  this.once('connected', function () {
    service.srem(key, value, callback);
  });

  // Connect.
  connectCache();
}

/**
 * Returns all the members of the set value stored at key.
 *
 * @param key
 *   The key to lookup.
 * @param callback
 *   Callback funcion to call on completion. It will send two parameters "err" and "res".
 *
 * @return string
 *   The values if found else undefined.
 */
Cache.prototype.membersOfSet = function membersOfSet(key, callback) {
  // Handle connection event.
  this.once('connected', function () {
    service.smembers(key, callback);
  });

  // Connect.
  connectCache();
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
    service.hset(key, hash, value, callback);
  });

  // Connect.
  connectCache();
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
    service.hmget(key, hashes, callback);
  });

  // Connect.
  connectCache();
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
    service.hgetall(key, callback);
  });

  // Connect.
  connectCache();
}

// Export the object (exports uses cache, hence singleton).
module.exports = new Cache(backend);
