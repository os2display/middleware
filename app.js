/**
 * @file
 * First attempt on creating a proxy with socket.io.
 */

// Setup the basic variables need to create the server
var path = require('path');
var express = require('express');
var http = require('http');

// Get dependencies.
var validator = require('validator');
var routes = require('./routes');

// Basic app setup.
var app = express();
var server = http.createServer(app);
var sio = require('socket.io').listen(server);

// Get connected to redis as session store.
var RedisStore = require('connect-redis')(express);
var redis = require("redis").createClient();

var passportSocketIo = require('passport.socketio');

// Set express app configuration.
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// Setup session handling, used in auhentication.
app.use(express.cookieParser());
app.use(express.session({ store: new RedisStore({ host: 'localhost', port: 6379, client: redis }) }));
app.use(express.session({ secret: 'keyboard cat' }));

// Start the server.
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
})

// Configure socket.
sio.set('loglevel',10);


// set authorization for socket.io
sio.set('authorization', passportSocketIo.authorize({
  cookieParser: express.cookieParser,
  key:         'express.sid',       // the name of the cookie where express/connect stores its session_id
  secret:      'keyboard cat',      // the session_secret to parse the cookie
  store:       new RedisStore({ host: 'localhost', port: 6379, client: redis }),        // we NEED to use a sessionstore. no memorystore please
  success:     onAuthorizeSuccess,  // *optional* callback on success - read more below
  fail:        onAuthorizeFail,     // *optional* callback on fail/error - read more below
}));

function onAuthorizeSuccess(data, accept){
  console.log('successful connection to socket.io');

  // The accept-callback still allows us to decide whether to
  // accept the connection or not.
  accept(null, true);
}

function onAuthorizeFail(data, message, error, accept){
  console.log('failed connection to socket.io:', message);

  // We use this callback to log all of our failed connections.
  accept(null, false);
}

// Handle socket events.
sio.on('connection',function(socket){
  console.log(socket.handshake.user._id);
  socket.emit('init', {msg:"test"});
})

// Set express routes.
app.get('/', routes.index);
//app.get('/registry', routes.registry);

