/**
 * @file
 * First attempt on creating a proxy with socket.io.
 */

// Setup the basic variables need to create the server
var path = require('path');
var express = require('express');
var https = require('https');
var fs = require('fs');

// Certificate settings.
var options = {
  key: fs.readFileSync('ssl/server.key'),
  cert: fs.readFileSync('ssl/server.cert'),
  //ca: fs.readFileSync('./etc/ssl/ebscerts/bundle.crt')
};

// Basic app setup.
var app = express();
var server = https.createServer(options, app);
var sio = require('socket.io').listen(server);

// Token based auth.
var socketio_jwt = require('socketio-jwt');
var jwt = require('jsonwebtoken');
var jwt_secret = 'foo bar big secret';

// Set socket.io configuration.
//sio.enable('browser client minification');
//sio.enable('browser client etag');
//sio.enable('browser client gzip'); 
sio.set('log level', 10); 

// Set express app configuration.
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// Start the server.
server.listen(app.get('port'), function(){
  console.log('Express server with socket.io is listening on port ' + app.get('port'));
})

// Ensure that the JWT is used to authenticate socket.io connections.
sio.configure(function (){
  sio.set('authorization', socketio_jwt.authorize({
    secret: jwt_secret,
  	handshake: true
  }))
});

/************************
 * Socket events
 ***************/
sio.on('connection', function(socket) {
  console.log('Client connected');

  // Test the connection.
  socket.on('ping', function (data) {
    socket.emit('pong', {});
  });
});
// Load routes.
var routes = require('./routes/default');

/************************
 * Backend API
 *************/
app.get('/', routes.index);

app.post('/login', function(req, res) {
	routes.login(req, res, jwt, jwt_secret);
});

app.post('/pushScreens', routes.pushScreens);

/************************
 * Client API
 ************/
app.post('/activate', function(req, res) {
  routes.activate(req, res, jwt, jwt_secret);
});
