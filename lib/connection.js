/**
 * @file
 * Used to keep track of a given connection to a client.
 */

var util = require('util');
var Base = require('./base');

/**
 * Connection object as the module pattern that wrappes basic
 * socket.io communication for the application.
 */
var connection = (function() {

  /**
   * Defines the Connection object that handles Socket.io configuration and setup.
   */
  var Connection = function() {
    // Call base class contructor.
    Base.call(this);

    this.sio = undefined;
  }

  // Extend the object with event emitter.
  util.inherits(Connection, Base);

  /**
   * Configure and start the socket.io service.
   *
   * When a client connects a new client object will be object will be
   * created and send with an connection event. To the object that
   * called the connect function.
   *
   * @param server
   *   HTTP or HTTPS server to attach the socket to.
   * @param debug
   *   If true minification and compression will be disabled.
   * @param secret
   *   Secret string to use when authenticate new connections.
   */
  Connection.prototype.connect = function connect(server, debug, secret) {
    var self = this;

    // Ensure that this is only runned once.
    if (self.sio === undefined) {
      self.sio = require('socket.io')(server);

      // Set socket.io client configuration.
      if (debug === false) {
        self.sio.enable('browser client minification');
        self.sio.enable('browser client etag');
        self.sio.enable('browser client gzip');
      }

      // Ensure that the JWT is used to authenticate socket.io connections.
      // Token based auth.
      var socketio_jwt = require('socketio-jwt');
      self.sio.set('authorization', socketio_jwt.authorize({
        secret: secret,
        handshake: true
      }));

      // Handle incomming connection.
      var Client = require('./client');
      self.sio.on('connection', function(socket) {
        var client = new Client(socket);

        // Send socket wrapper object.
        self.emit('connection', client);

        // Log timestamp of last heartbeat.
        client.on('heartbeat', function() {
          var time = Math.round((new Date).getTime() / 1000);
          console.log(time);
          self.redis.hset('screen:heartbeats', client.getToken(), time, function(err, res) {
            if (err) {
              self.error(500, 'Redis encounted an error in heartbeat.');
            }
          });
        });
      });
    }
  }

  /**
   * Boardcast a message to all clients in a group.
   *
   * @param array groups
   *   Array of group names as strings.
   * @param string event
   *   Name of the event to send.
   * @param array data
   *   Content formatted as described in the API documentation.
   */
  Connection.prototype.boardcast = function boardcast(groups, event, data) {
    if (this.sio !== undefined) {
      var len = groups.length;
      for (var i = 0; i < len; i++) {
        this.log('Boardcast event (' + event +') for: ' + groups[i]);
        this.sio.sockets.in(groups[i]).emit(event, data);
      }
    }
  }

  // Return a new connection object (this invokes a singleton pattern).
  return new Connection();

})();

// Export the object.
module.exports = connection;
