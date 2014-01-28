
$.ajax({
  type: 'POST',
  data: {
    username: 'test',
	password: 'password'
  },
  url: '/login'
}).done(function (result) {
  var sio = io.connect('http://127.0.0.1:3000', { query: 'token=' + result.token });

  sio.socket.on('error', function (reason){
    console.error('Unable to connect Socket.IO', reason);
  });

  sio.on('init', function (data) {
    console.log(data);
  });
});
