/**
 * @file
 * Configuration object mock.
 */

var ConfigurationMock = function() {

  var conf = {
    "sitename": "Test site",
    "port": 3000,
    "ssl": {
      "active": false,
      "key": "/etc/ssl/nginx/server.key",
      "cert": "/etc/ssl/nginx/server.cert",
      "ca": false
    },
    "secret": "THIS IS THE SUPER SECRET KEY",
    "debug": false,
    "log_level": 10,
    "maintenance": {
      "username": "admin",
      "password": "password"
    },
    "cache": {
      "port": "6379",
      "host": "localhost",
      "auth": null,
      "db": 15
    },
    "backend": {
      "host": "service.infostander.vm",
      "ip": "127.0.0.1",
      "port": "80"
    },
    "log": "test.log"
  }

  this.get = function get(property) {
    return conf[property];
  }
}

module.exports = new ConfigurationMock();