/**
 * @file
 * The applications controllers.
 */

/**
 * Main application controller.
 */
app.controller('MainController', ['$scope', '$route', '$routeParams', '$location',
  function($scope, $route, $routeParams, $location) {
    "use strict";

  }
]);

/**
 * Login page.
 */
app.controller('LoginController', ['$scope', '$http', '$window', '$location',
  function($scope, $http, $window, $location) {
    "use strict";

    $scope.login = function login() {
      $http.post('/login', $scope.user)
        .success(function (data, status, headers, config) {
          // Store token in session.
          $window.sessionStorage.token = data.token;

          $location.path('apikeys');
        })
        .error(function (data, status, headers, config) {
          // Erase the token if the user fails to log in
          delete $window.sessionStorage.token;

          // Handle login errors here
          $scope.message = 'Error: Invalid user or password';
        }
      );
    };
  }
]);

/**
 * Logout page.
 */
app.controller('LogoutController', ['$scope', '$window',
  function($scope, $window) {
    "use strict";

    // Remove the token from login.
    delete $window.sessionStorage.token;
  }
]);


/**
 * Navigation helpers.
 */
app.controller('NavigationController', ['$scope', '$location',
  function($scope, $location) {
    "use strict";

    $scope.isActive = function (viewLocation) {
      return viewLocation === $location.path();
    };
  }
]);

/**
 * API keys page.
 */
app.controller('ApiKeysController', ['$scope', '$window', '$location', 'ngOverlay', 'dataService',
  function($scope, $window, $location, ngOverlay, dataService) {
    "use strict";

    // Check that the user is logged in.
    if (!$window.sessionStorage.token) {
      $location.path('');
    }

    /**
     * Load API keys.
     */
    function loadApikeys() {
      // Get user/api key information form the backend.
      dataService.fetch('get', '/api/admin/keys').then(
        function (data) {
          $scope.apikeys = data;
        },
        function (reason) {
          $scope.message = reason.message;
          $scope.messageClass = 'alert-danger';
        }
      );
    }

    /**
     * Remove API key.
     */
    $scope.remove = function remove(key) {
      var scope = $scope.$new(true);

      scope.title = 'Remove API key';
      scope.message = 'Remove the key "' + key + '". This can not be undone.';
      scope.okText = 'Remove';

      scope.confirmed = function confirmed() {
        dataService.fetch('delete', '/api/admin/key/' + key).then(
          function (data) {
            $scope.message = data;
            $scope.messageClass = 'alert-success';

            // Update api key list.
            loadApikeys();

            // Close overlay.
            overlay.close();
          },
          function (reason) {
            $scope.message = reason.message;
            $scope.messageClass = 'alert-danger';
          }
        );
      };

      // Open the overlay.
      var overlay = ngOverlay.open({
        template: "views/confirm.html",
        scope: scope
      });
    };

    /**
     * Add API key callback.
     */
    $scope.add = function add() {
      var scope = $scope.$new(true);

      // Add default API key information.
      scope.api = {
        "key": '',
        "name": '',
        "expire": 300,
        "backend": ''
      };

      // Update api key.
      scope.$watch("api.name", function(newValue, oldValue) {
        if (newValue.length > 0) {
          scope.api.key = CryptoJS.MD5(newValue + Math.random()).toString();
        }
        else {
          scope.api.key = '';
        }
      });

      /**
       * Save API key callback.
       */
      scope.save = function save() {
        dataService.send('post', '/api/admin/key', { "api": scope.api }).then(
          function (data) {
            $scope.message = data;
            $scope.messageClass = 'alert-success';

            // Reload API keys.
            loadApikeys();

            // Close overlay.
            overlay.close();
          },
          function (reason) {
            $scope.message = reason.message;
            $scope.messageClass = 'alert-danger';
          }
        );
      };

      // Open the overlay.
      var overlay = ngOverlay.open({
        template: "views/keyAdd.html",
        scope: scope
      });
    };

    /**
     * Edit API key callback.
     */
    $scope.edit = function edit(key) {
      dataService.fetch('get', '/api/admin/key/' + key).then(
        function (data) {
          var scope = $scope.$new(true);

          // Set API key information.
          scope.api = data;

          // Set key.
          scope.api.key = key;

          /**
           * Save API key callback.
           */
          scope.save = function save() {
            dataService.send('put', '/api/admin/key/' + key, { "api": scope.api }).then(
              function (data) {
                $scope.message = data;
                $scope.messageClass = 'alert-success';

                // Reload API key list.
                loadApikeys();

                // Close overlay.
                overlay.close();
              },
              function (reason) {
                $scope.message = reason.message;
                $scope.messageClass = 'alert-danger';
              }
            );
          };

          // Open the overlay.
          var overlay = ngOverlay.open({
            template: "views/keyEdit.html",
            scope: scope
          });
        },
        function (reason) {
          $scope.message = reason.message;
          $scope.messageClass = 'alert-danger';
        }
      );
    };

    // Get the controller up and running.
    loadApikeys();
  }
]);
