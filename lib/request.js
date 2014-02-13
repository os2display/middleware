/**
 * @file
 * Handle http request to the backend.
 */
var util = require('util');
var eventEmitter = require('events').EventEmitter;

/**
 * Request object as the module pattern.
 */
var Request = (function() {

  var Request = function() {
    this.options = {
      hostname: global.config.get('backend').host,
      port: global.config.get('backend').port,
      path: '',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Length': 0
      }
    };
  }

  // Extend the object with event emitter.
  util.inherits(Request, eventEmitter);

  Request.prototype.send = function send(path, json) {
    var self = this;

    // Encode the JSON into string.
    var data = JSON.stringify(json);

    // Create options array for the request.
    var options = this.options;
    options['path'] = path;
    options.headers['Content-Length'] = data.length;

    var http = require('http');
    var req = http.request(options, function(res) {
      var msg = '';

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        msg += chunk;
      });

      // Handle end request.
      res.on('end', function() {
        if (res.statusCode == 200) {
          self.emit('completed', JSON.parse(msg));
        }
        else {
          self.emit('error', { statusCode: res.statusCode });
        }
      });
    });

    req.write(data);
    req.end();
  }

  return Request;

})();

// Export the object.
module.exports = Request;