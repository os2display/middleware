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

// Add logger.
var Log = require('log')
var logger = new Log('info', fs.createWriteStream(config.get('log'), {'flags': 'a'}));

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
var Connection = require('./lib/connection');
var con = new Connection(server, config.get('debug'), config.get('secret'));

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

/************************************
 * Load application objects
 **************************/
var screens = require('./lib/screens');

/************************************
 * Socket events
 ***************/
con.on('connection', function(client) {

  /**
   * Ready event.
   */
  client.on('ready', function (data) {
    // Create new screen object. @todo move into screens.
    var instance = screens.createScreen(data.token, client);
    instance.load();

    // Actions when screen have been loaded.
    instance.on('loaded', function (data) {
      // Join rooms/groups.
      var groups = instance.get('groups');
      client.join(groups);

      // Send a 200 ready code back to the client.
      client.ready(200);

      // Push channels to the screen, if any channels exists.
      instance.push();
    });

    // Handle errors.
    instance.on('error', function (data) {
      // All errors are automatically logged in Base class.
      if (data.code === 404) {
        // If screen is not known any more dis-connect.
        client.kick(data.code);
      }
    });
  });

  // If client disconnects remove the screen from the active list.
  client.on('disconnect', function(data) {
    screens.removeScreen(client.getToken());
  });

  /**
   * Pause event.
   */
  client.on('pause', function (data) {
    // Remove the client from the rooms/groups.
    client.leaveRooms();

    // Send feedback to the client.
    client.pause(200);
  });
});

/************************************
 * Application routes
 ********************/
var routes = require('./routes/local');

app.get('/', routes.index);

app.post('/login', function(req, res) {
	routes.login(req, res, config.get('secret'));
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
  routes_frontend.activate(req, res, config.get('secret'));
});
