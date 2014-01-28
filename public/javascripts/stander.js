var socket = io.connect('http://127.0.0.1:3000');
socket.on('init', function (data) {
  console.log(data);
});