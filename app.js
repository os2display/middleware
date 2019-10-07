#!/usr/bin/env node

/**
 * @file
 * This is the main application that uses architect to build the application
 * base on plugins.
 */

var path = require('path');
var architect = require("architect");

// Load config file.
var configs = require(__dirname + '/config.json');

// Configure the plugins.
var config = [
  {
    "packagePath": "./plugins/logger",
    "logs": configs.logs
  },
  {
    "packagePath": "./plugins/jobs"
  },
  {
    "packagePath": "./plugins/server",
    "port": configs.port,
    "path": path.join(__dirname, 'public')
  },
  {
    "packagePath": "./plugins/admin",
    "secret": configs.secret
  },
  {
    "packagePath": "./plugins/cache",
    "config": configs.cache
  },
  {
    "packagePath": "./plugins/apikeys",
    "file": __dirname + '/' + configs.apikeys
  },
  {
    "packagePath": "./plugins/socket",
    "secret": configs.secret
  },
  {
    "packagePath": "./plugins/auth",
    "secret": configs.secret,
    "admin": configs.admin
  },
  {
    "packagePath": "./plugins/client"
  },
  {
    "packagePath": "./plugins/screen"
  },
  {
    "packagePath": "./plugins/channel"
  },
  {
    "packagePath": "./plugins/api",
    "secret": configs.secret
  },
  {
    "packagePath": "./plugins/dashboard",
    "htpasswd": configs.dashboard.htpasswd,
    "blacklist": configs.dashboard.blacklist,
    "expire": configs.dashboard.expire
  }
];

// User the configuration to start the application.
config = architect.resolveConfig(config, __dirname);
architect.createApp(config, function (err, app) {
  "use strict";

  if (err) {
    throw err;
  }
});
