/**
 * @file
 * Handle http request to the backend.
 */
var util = require('util');
var Base = require('./base');

var Request = function() {
  // Call base class contructor.
  Base.call(this);

  // Configure the request.
  this.options = {
    hostname: this.config.get('backend').host,
    port: this.config.get('backend').port,
    path: '',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': 0
    }
  };

  // Check if request is https.
  if (this.config.get('backend').port == 443) {
    this.options['rejectUnauthorized'] = false;
    this.options['requestCert'] = true;
  }
};

// Extend the object with event emitter.
util.inherits(Request, Base);

Request.prototype.send = function send(path, json) {
  var self = this;

  // Encode the JSON into string.
  var data = JSON.stringify(json);

  // Create options array for the request.
  var options = this.options;
  options['path'] = path;
  options.headers['Content-Length'] = data.length;

  // Check if ssl should be used.
  if (self.config.get('backend').port == 443) {
    var http = require('https');
  }
  else {
    var http = require('http');
  }

  var req = http.request(options, function(res) {
    var msg = '';

    res.setEncoding('utf8');
    res.on('data', function(chunk) {
      msg += chunk;
    });

    // Handle end request.
    res.on('end', function() {
      if (res.statusCode == 200) {
        if (msg.length) {
          self.emit('completed', JSON.parse(msg));
        }
        else {
          self.emit('completed', {});
        }

      }
      else {
        self.emit('error', { statusCode: res.statusCode });
      }
    });
  });

  // Log request.
  this.logger.info(200, 'Request sent to: ' + path);

  // Send the request.
  req.write(data);
  req.end();
}


// Export the object.
module.exports = Request;
