/**
 * @file
 * A dashboard for screen surveillance.
 */

/**
 * Dashboard class.
 *
 * @param app
 *   The express Application.
 * @param logger
 *   The event logger.
 * @param apikeys
 *   API key object.
 * @param cache
 *   Cache object.
 * @param Screen
 *   Screen object.
 *
 * @constructor
 */
var Dashboard = function Admin(app, logger, apikeys, cache, Screen, options) {
  "use strict";

  var twig = require('twig');
  var fs = require('fs');

  this.moment = require('moment');
  this.jf = require('jsonfile');

  var self = this;
  this.logger = logger;
  this.cache = cache;
  this.apikeys = apikeys;
  this.screen = Screen;
  this.config = options;

  this.Q = require('q');

  /**
   * Basic authentication helper function.
   */
  this.auth = function auth(req, res, next) {
    var fs = require('fs');
    var basicAuth = require('basic-auth');
    var htpasswd = require('htpasswd-auth');

    function unauthorized(res) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.sendStatus(401);
    }

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
      return unauthorized(res);
    }

    try {
      var file = fs.readFileSync(__dirname + '/../../' + self.config.htpasswd, 'utf8');
      htpasswd.authenticate(user.name, user.pass, file).then(function (auth) {
        if (auth) {
          return next();
        }
        else {
          return unauthorized(res);
        }
      });
    }
    catch (err) {
      if (err.code === 'ENOENT') {
        console.error('Missing the password file for dashboard authentication. Please create the htacces password file using Apache 2 utils to generate the file.');
      }
      else {
        console.error(err.message);
      }
    }
  };

  // Interpreted and loaded here as it will be used many times.
  this.bashboardTemplate = twig.twig({
    data: fs.readFileSync(__dirname + '/views/status.html', 'utf8')
  });

  /**
   * Dashboard index page.
   */
  app.get('/dashboard', self.auth, function (req, res) {
    // Create local every time to not use global memory for the template.
    var template = twig.twig({
      data: fs.readFileSync(__dirname + '/views/dashboard.html', 'utf8')
    });

    res.send(template.render({
      page_title: 'Dashboard'
    }));
  });

  /**
   * Dashboard status callback.
   */
  app.get('/dashboard/status', self.auth, function (req, res) {
    self.buildScreenData().then(function (screens) {
      res.send(self.bashboardTemplate.render({
        page_title: 'OS2display screen',
        date: {
          month: self.moment().format('MMMM'),
          day: self.moment().format('D'),
          year: self.moment().format('YYYY')
        },
        screens: screens
      }));
    },
    function error(error) {
      res.status(500).send(error.message);
    })
  });

  /**
   * Configuration page to blacklist screens from the critical list.
   *
   * This could be used to hide develeopment/test screens from the overview.
   */
  app.get('/dashboard/blacklist', self.auth, function (req, res) {
    // Create local every time to not use global memory for the template.
    var template = twig.twig({
      data: fs.readFileSync(__dirname + '/views/blacklist.html', 'utf8')
    });

    self.buildScreenData().then(function (screens) {
      self.load().then(function (blacklist) {
        res.send(template.render({
          page_title: 'Blacklist configuration',
          screens: screens,
          blacklist: blacklist
        }));
      });
    },
    function error(error) {
      res.status(500).send(error.message);
    })
  });

  /**
   * Ajax callback function to update the blacklist json file.
   */
  app.post('/dashboard/blacklist/save', self.auth, function (req, res) {
    var filteredList = {};
    var list = req.body;
    for (var i in list) {
      var screen = list[i];
      if (!filteredList.hasOwnProperty(screen.apikey)) {
        filteredList[screen.apikey] = [];
      }
      filteredList[screen.apikey].push(screen.id);
    }
    self.save(filteredList);
    res.json({});
  });
};

/**
 * Helper function to async load all information about screens known to the middleware.
 */
Dashboard.prototype.buildScreenData = function buildScreenData() {
  var self = this;
  var deferred = self.Q.defer();

  // Defined the final data structure that is used to render the page.
  var screens = {
    critical: {},
    blacklist: {},
    all: {},
    count: {
      total: 0,
      critical: 0,
      blacklist: 0
    },
    expire: self.config.expire
  };

  // First load the blacklist, then load api keys and then loop over the api keys
  // get the screens hartbeat information by loading them.
  self.load().then(
    function (blacklist) {
      self.apikeys.load().then(
        function (keys) {
          for (var apikey in keys) {
            self.cache.membersOfSet('screen:' + apikey, function (err, data) {
              self.Q().then(function () {
                var screenPromises = [];
                // Loop over screens and build promises array.
                for (var i in data) {
                  screenPromises.push(self.loadScreen(apikey, keys[apikey].name, data[i]));
                }

                return screenPromises;
              })
              .all()
              .then(function (loadedScreens) {
                // When all promises (screens are load) resovled loop over the screens.
                for (var i in loadedScreens) {
                  var screen = loadedScreens[i];

                  // Check blacklist.
                  if (blacklist.hasOwnProperty(screen.apikey) && blacklist[screen.apikey].includes(screen.id)) {
                    if (!screens.blacklist.hasOwnProperty(screen.apikey)) {
                      screens.blacklist[screen.apikey] = [];
                    }
                    screens.blacklist[screen.apikey].push(screen);
                    screens.count.blacklist++;
                  }
                  else {
                    // Check if beat has expire and add it to "critical" bucket.
                    if (screen.expired) {
                      if (!screens.critical.hasOwnProperty(screen.apikey)) {
                        screens.critical[screen.apikey] = [];
                      }
                      screens.critical[screen.apikey].push(screen);
                      screens.count.critical++;
                    }
                  }

                  // Add all beats to the all array.
                  if (!screens.all.hasOwnProperty(screen.apikey)) {
                    screens.all[screen.apikey] = [];
                  }
                  screens.all[screen.apikey].push(screen);
                  screens.count.total++;
                }
                deferred.resolve(screens);
              },
              function (error) {
                deferred.reject(error);
              })
            });
          }
        },
        function (error) {
          deferred.reject(error);
        }
      );
    },
    function (error) {
      deferred.reject(error);
    }
  );

  return deferred.promise;
};

/**
 * Helper function to load a screen.
 *
 * @param apikey
 *   API-key for the screen to load.
 * @param name
 *   The name linked to the api-key.
 * @param screenId
 *   The id of screen to load.
 *
 * @returns {*}
 */
Dashboard.prototype.loadScreen = function loadScreen(apikey, name, screenId) {
  var self = this;
  var deferred = self.Q.defer();

  var screen = new self.screen(apikey, screenId);
  screen.load().then(
    function (screenObj) {
      deferred.resolve({
        apikey: apikey,
        name: name,
        id: screenObj.id,
        title: screenObj.title,
        heartbeat: self.moment.unix(screenObj.heartbeat).format('D. MMMM YYYY HH:mm:ss'),
        expired: self.expired(screenObj.heartbeat)
      })
    },
    function (error) {
      self.logger.error(error.message);
      deferred.reject(error.message);
    }
  );

  return deferred.promise;
};

/**
 * Check if a given timestamp has expired.
 *
 * @param timestamp
 *   Unix-timestamp.
 *
 * @returns
 *   TRUE if expired else FALSE.
 */
Dashboard.prototype.expired = function expired(timestamp) {
  var self = this;
  return timestamp < Math.round((new Date()).getTime() / 1000) - self.config.expire;
};

/**
 * Load blacklist form disk.
 *
 * @returns {*}
 *   Promise that either will resolve when the data is ready or reject with an
 *   error.
 */
Dashboard.prototype.load = function load() {
  "use strict";

  var self = this;
  var deferred = self.Q.defer();

  self.jf.readFile(__dirname + '/../../' + self.config.blacklist, function(error, list) {
    if (error) {
      deferred.reject(new Error(error));
    }
    else {
      deferred.resolve(list);
    }
  });

  return deferred.promise;
};

/**
 * Save blacklist to disk.
 *
 * @param string[] list
 *  The blacklist with apikeys and screen ids as objects.
 *
 * @returns {*}
 *   Promise that either will resolve when the data is saved or reject with an
 *   error.
 */
Dashboard.prototype.save = function save(list) {
  "use strict";

  var self = this;
  var deferred = self.Q.defer();

  self.jf.writeFile(self.config.blacklist, list, function (error) {
    if (error) {
      deferred.reject(new Error(error));
    }
    else {
      deferred.resolve(200);
    }
  });

  return deferred.promise;
};

/**
 * Validate that the role is admin.
 *
 * @param req
 *   Express request object.
 */
Dashboard.prototype.validateCall = function validateCall(req) {
  "use strict";

  return (req.hasOwnProperty('user')) && (req.user.role === 'admin');
};

/**
 * Register the plugin with architect.
 */
module.exports = function (options, imports, register) {
  "use strict";

  // Create the API routes using the API object.
  new Dashboard(imports.app, imports.logger, imports.apikeys, imports.cache, imports.screen, options);

  // This plugin extends the server plugin and do not provide new services.
  register(null, null);
};
