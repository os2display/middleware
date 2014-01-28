/**
 * @file
 * First attempt on creating a proxy with socket.io.
 */

// Setup the basic variables need to create the server
var path = require('path');
var express = require('express');
var http = require('http');

var routes = require('./routes');

var app = express();
var server = http.createServer(app);
var sio = require('socket.io').listen(server);

// Set express app configuration.
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Start the server.
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
})

// Configure socket.
sio.set('loglevel',10);

// Handle socket events.
sio.on('connection',function(socket){
  socket.emit('init', {msg:"test"})
})

// Set express routes.
app.get('/', routes.index);
