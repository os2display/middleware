$(document).ready(function() {

  var socket = undefined;
  var token =  undefined;

  function setMessage(msg, type) {
    var m = $('.message p');    
    m.removeClass()
    m.addClass(type);
    m.text(msg);
  }

  function connect() {
    socket = io.connect('//localhost:3000', { query: 'token=' + token });
    socket.socket.on('error', function (reason) {
      setMessage(reason, 'bg-danger');
    });

    socket.on('connect', function () {
      setMessage('Connected to the server.', 'bg-info');
      $('.form-signin').hide();

      socket.emit('ready', { token: token });      
    });

    socket.on('disconnect', function () {
      setMessage('Disconnect from the server.', 'bg-info');
    });

    socket.on('reconnecting', function () {
      setMessage('Trying to re-connecting to the server.', 'bg-warning');
    });

    socket.on('pong', function () {
      setMessage('Pong received from: ' + socket.socket.options.host, 'bg-success');
    });    
  }

  // Add event handler to click button.
  //$('.ping').click(function() {
  //  if (socket != undefined) {
  //    socket.emit('ping', {});
  //  }
  //});

  // Hook into the login form.
  $('.form-signin button[type=submit]').click(function(e) {
    e.preventDefault();
    $.ajax({
      type: 'POST',
      data: JSON.stringify({
          username: $('.form-signin .username').val(),
          password: $('.form-signin .password').val()        
      }),
      contentType: "application/json; charset=utf-8",
      dataType: "json",
      url: '/login',
      success: function (data, text) {
        token = data.token;
        // Result from the server, try to make socket connection.
        connect();
      },
      error: function (request, status, error) {
        if (request.status === 403) {
          setMessage('Please try another username or password', 'bg-danger');
        }
        else {
          setMessage(error, 'bg-danger');
        }
      }
    });
  });
});