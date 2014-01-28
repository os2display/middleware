/**
 * @file
 * First attempt on creating a proxy with socket.io.
 */

// Setup the basic variables need to create the server
var path = require('path');
var express = require('express');
var http = require('http');

// Get dependencies.
var routes = require('./routes');

// Basic app setup.
var app = express();
var server = http.createServer(app);
var sio = require('socket.io').listen(server);

// Token based auth.
var socketio_jwt = require('socketio-jwt');
var jwt = require('jsonwebtoken');
var jwt_secret = 'foo bar big secret';

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
  console.log('Express server listening on port ' + app.get('port'));
})

sio.configure(function (){
  sio.set('authorization', socketio_jwt.authorize({
    secret: jwt_secret,
  	handshake: true
  }))
});

// Handle socket events.
sio.on('connection', function(socket) {
  console.log(socket.handshake.decoded_token.email, 'connected');
  socket.emit('init', {msg:"test"});
})

// Set express routes.
app.get('/', routes.index);

// Login request.
app.post('/login', function (req, res) {
  
  var profile = {
    username: req.body.username,
    password: req.body.password
  };

  // We are sending the profile inside the token
  var token = jwt.sign(profile, jwt_secret, { expiresInMinutes: 60*5 });

  res.json({token: token});
});
