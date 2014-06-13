#!/usr/bin/env node

/**
 * @file
 * First attempt on creating a proxy with socket.io.
 */

// Setup the basic variables need to create the server
var path = require('path');
var express = require('express');
var fs = require('fs');
var config = require('nconf');

// Start the app.
var app = express();

// Load configuration.
config.file({ file: 'config.json' });
global.config = config;

// As the server proxies (nginx) the web-socket and socket.io.js
// request. This trick is used to make the local instances work.
var http = undefined;
var server = undefined;
if (config.get('ssl').active) {
  // Certificate settings.
  var options = {
    key: fs.readFileSync(config.get('ssl').key),
    cert: fs.readFileSync(config.get('ssl').cert),
    //ca: fs.readFileSync('./etc/ssl/ebscerts/bundle.crt')
  };
  if (config.get('ssl').key.ca) {
    options.ca = fs.readFileSync(config.get('ssl').key.ca);
  }

  // Start the https server.
  http = require('https');
  server = http.createServer(options, app);
}
else {
  // Start the http server.
  http = require('http');
  server = http.createServer(app);
}

// Add socket.io to the mix.
var sio = require('socket.io')(server);
global.sio = sio;

// Token based auth.
var socketio_jwt = require('socketio-jwt');
var jwt = require('jsonwebtoken');
var jwt_secret = config.get('secret');

// Set socket.io client configuration.
if (config.get('debug') === false) {
  sio.enable('browser client minification');
  sio.enable('browser client etag');
  sio.enable('browser client gzip');
}


// Set express app configuration.
app.set('port', config.get('port'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// Log express requests.
if (config.get('debug')) {
  app.use(express.logger('dev'));
};

// Start the server.
server.listen(app.get('port'), function (){
  if (config.get('debug')) {
    console.log('Express server with socket.io is listening on port ' + app.get('port'));
  }
});

// Connect to redis server.
var redis = require("redis");
var rconf = config.get('redis')
global.redisClient = redis.createClient(rconf.port, rconf.host, { 'auth_pass': rconf.auth });
redisClient.on('error', function (err) {
  console.log(err);
});
redisClient.on("connect", function (err) {
  if (config.get('debug')) {
    console.log('Connected to redis server at: ' + rconf.host);
  }
});

// Ensure that the JWT is used to authenticate socket.io connections.
sio.set('authorization', socketio_jwt.authorize({
  secret: jwt_secret,
	handshake: true
}));

/************************************
 * Load application objects
 **************************/
var rooms = [];
var Screen = require('./lib/screen');

/************************************
 * Socket events
 ***************/
sio.on('connection', function(socket) {

  /**
   * Ready event.
   */
  socket.on('ready', function (data) {
    // Create new screen object.
    var instance = new Screen(data.token);
    instance.load();

    // Actions when screen have been loaded.
    instance.on('loaded', function (data) {
      // Store socket id.
      instance.set('socketID', socket.id);

      // The screen have been updated with socket ID, so save it.
      instance.save();

      // Join rooms/groups.
      var groups = instance.get('groups');
      for (var i in groups) {
        socket.join(groups[i]);
      }

      // Send a 200 ready code back to the client.
      socket.emit('ready', { statusCode: 200 });

      // Push channels to the screen, if any channels exists.
      instance.push();
    });

    // Handle errors.
    instance.on('error', function (data) {
      // All errors are automatically logged in Base class.
      // If screen is not known any more dis-connect.
      if (data.code === 404) {
        socket.emit('ready', { statusCode: 404 });
        socket.disconnect('unauthorized');
      }
    });
  });

  /**
   * Pause event.
   */
  socket.on('pause', function (data) {
    // Get a list of rooms that this socket is in.
    var rooms = sio.sockets.manager.roomClients[socket.id];

    // Remove the socket from the rooms.
    for (var room in rooms) {
      room = room.substring(1);
      socket.leave(room);
    }

    // Send feedback to the client.
    socket.emit('pause', { statusCode: 200 });
  });
});

/************************************
 * Application routes
 ********************/
var routes = require('./routes/local');

app.get('/', routes.index);

app.post('/login', function(req, res) {
	routes.login(req, res, jwt, jwt_secret);
});

/************************************
 * Backend API
 *************/
var routes_backend = require('./routes/backend');

app.post('/screen/update', routes_backend.screenUpdate);
app.post('/screen/reload', routes_backend.screenReload);
app.post('/screen/remove', routes_backend.screenRemove);
app.post('/push/channel', routes_backend.pushChannel);
app.post('/push/emergency', routes_backend.pushEmergency);
app.post('/status', routes_backend.status);

/************************************
 * Client API
 ************/
var routes_frontend = require('./routes/frontend');

app.post('/activate', function (req, res) {
  routes_frontend.activate(req, res, jwt, jwt_secret);
});
