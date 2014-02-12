/**
 * @file
 * Handle http request to the backend.
 */

/**
 * Request object as the module pattern.
 */
var Request = (function() {

  var Request = function() {
    this.options = {
      host: global.config.backend.host,
      port: global.config.backend.port,
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

    var req = http.request(options, function(res) {
      var msg = '';

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        msg += chunk;
      });

      res.on('end', function() {
        self.emit('completed', JSON.parse(msg));
      });
    });

    req.write(data);
    req.end();
  }

  return Request;

})();
