/**
 * @file
 * Used to keep track of screen connections and tokens to identify screens.
 */

var Screen = (function() {

  // Define object with variables.
  var Screen = function(token, socket) {
    this.id = undefined;
    this.name = undefined;
    this.groups = [];

    this.token = token;
    this.socket = socket;
  }

  Screen.prototype.load = function() {
    var self = this;
    
  }

  Screen.prototype.save = function() {
    var self = this;

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
