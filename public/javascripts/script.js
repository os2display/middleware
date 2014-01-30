$(document).ready(function() {

  function setMessage(msg, type) {
    var m = $('.message p');    
    m.removeClass()
    m.addClass(type);
    m.text(msg);
  }

  function connect(token) {
    var sio = io.connect('//localhost:3000', { query: 'token=' + token });
    sio.socket.on('error', function (reason) {
      setMessage(reason, 'bg-danger');
    });

    sio.on('connect', function () {
      setMessage('Connected to the server.', 'bg-info');
      $('.form-signin').hide();
    });

    sio.on('disconnect', function () {
      setMessage('Disconnect from the server.', 'bg-info');
    });

    sio.on('reconnecting', function () {
      setMessage('Trying to re-connecting to the server.', 'bg-warning');
    });

    sio.on('ping', function (data) {
      setMessage('Message received (ping): ' + data.msg, 'bg-success');
    });
  }

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
        // Result from the server, try to make socket connection.
        connect(data.token);
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