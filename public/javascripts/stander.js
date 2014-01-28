$(document).ready(function() {

  function setMessage(msg) {
    var m = $('.messages ol');
    m.append($('<li>' + msg + '</li>'));
  }

  $.ajax({
    type: 'GET',
    data: {
      username: 'test',
	    password: 'password'
    },
    url: '/login'
  }).done(function (result) {
    var sio = io.connect('http://127.0.0.1:3000', { query: 'token=' + result.token });
    sio.on('error', function (reason) {
      setMessage('Error: ' + reason);
    });

    sio.on('connecting', function (data) {
      setMessage('Connecting to server via a ' + data);
    });

    sio.on('connect', function () {
      setMessage('Connected to the server.');
    });

    sio.on('disconnect', function () {
      setMessage('Disconnect from the server.');
    });

    sio.on('reconnecting', function () {
      setMessage('Re-connecting to the server.');
    });

    sio.on('ping', function (data) {
      setMessage('Message received (ping): ' + data.msg);
      console.log(data);
    });
  });
});