/**
 * @file
 * Used to keep track of screen connections and tokens to identify screens.
 */

var Screen = (function() {

  // Define object with variables.
  var Screen = function(token) {
    this.id = undefined;
    this.name = undefined;
    this.groups = [];

    this.token = token;
    this.socket = undefined;

    this.redis = global.redisClient;
  }

  Screen.prototype.load = function(callback) {
    var self = this;

    // Check if screen exists in redis (token).
    self.redis.hget('screen:lookup:token', self.token, function(err, res) {
      if (err) {
        throw new Error('Redis encounted an error');
      }

      if (res != null) {
        var data = JSON.parse(res);
        self.id = data.id;

        self.redis.get('screen:' + self.id, function(err, res) {
          var data = JSON.parse(res);
          self.name = data.name;
          self.groups = data.groups;

          // Execute the callback.
          callback();
        });        
      }
      else {
        // Call backend to get screen information.
        // @TODO: call backend.
        console.log('INSERTING DUMMY DATA INTO SCREEN');
        self.id = self.token.substring(1, 8);
        self.name = 'TEST ' + self.id;
        self.groups = [ '43218765' ];

        // Save content.
        self.save(callback);
      }
    });
  }

  Screen.prototype.save = function(callback) {
    var self = this;

    console.log('screen:' + self.id);

    var data = {
      name: self.name,
      groups: self.groups
    }

    self.redis.set('screen:' + self.id, JSON.stringify(data), function(err, res) {
      if (err) {
        throw new Error('Redis encounted an error 1');
      }
      self.redis.hset('screen:lookup:token', self.token, JSON.stringify({ id: self.id }), function(err, res) {
        if (err) {
          throw new Error('Redis encounted an error 2');
        }

        callback();
      });    
    });
  }

  Screen.prototype.get = function(property) {
    var self = this;

    if (self.hasOwnProperty(property)) {
      return self[property];
    }

    throw new Error("Property is not defined");
  }

  Screen.prototype.set = function(property, value) {
    var self = this;

    if (self.hasOwnProperty(property)) {
      self[property] = value;
    }
    else {
      throw new Error("Property is not defined");
    }
  }

  return Screen;
})();

module.exports = Screen;
