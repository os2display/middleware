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
var io = require('socket.io').listen(server);


server.listen(3000)
io.set('loglevel',10) // set log level to get all debug messages

io.on('connection',function(socket){
  socket.emit('init', {msg:"test"})
})

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', routes.index);
