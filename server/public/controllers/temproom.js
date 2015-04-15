angular.module('MyApp')
  .controller('tempRoomCtrl', function($scope, $window, $location, $stateParams, $auth, $alert, Account, Room) {

    $scope.roomId = $stateParams.roomId;

    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };

    var scripts = [
      'https://www.webrtc-experiment.com/RTCMultiConnection-v1.8.js',
      'linkify.js',
      'ui.main.js',
      'ui.peer-connection.js',
      'ui.share-files.js',
      'ui.users-list.js',
      'ui.settings.js',
      'ui.complete-load.js'  // this must come last!
    ];
    var src;
    var script;
    var pendingScripts = [];
    var firstScript = document.scripts[0];

    // Watch scripts load in IE
    function stateChange() {
      // Execute as many scripts in order as we can
      var pendingScript;
      while (pendingScripts[0] && pendingScripts[0].readyState == 'loaded') {
        pendingScript = pendingScripts.shift();
        // avoid future loading events from this script (eg, if src changes)
        pendingScript.onreadystatechange = null;
        // can't just appendChild, old IE bug if element isn't closed
        firstScript.parentNode.insertBefore(pendingScript, firstScript);
      }
    }

    // loop through our script urls
    while (src = scripts.shift()) {
      if ('async' in firstScript) { // modern browsers
        script = document.createElement('script');
        script.async = false;
        script.src = src;
        document.head.appendChild(script);
      }
      else if (firstScript.readyState) { // IE<10
        // create a script and add it to our todo pile
        script = document.createElement('script');
        pendingScripts.push(script);
        // listen for state changes
        script.onreadystatechange = stateChange;
        // must set src AFTER adding onreadystatechange listener
        // else we’ll miss the loaded event for cached scripts
        script.src = src;
      }
      else { // fall back to defer
        document.write('<script src="' + src + '" defer></'+'script>');
      }
    }

      /* A one-time watch to wait until the scripts are done loading */
      var unbindWatcher = $scope.$watch(
          function () {
            return $window.allScriptsAreLoaded;
          },

          function (newVal) {
            if (newVal) {
              console.log("scripts are loaded!");
              unbindWatcher();
              Account.getProfile().then(function (response) {
                $scope.user = response.data;
                $window.continueclick($scope.user, $scope.roomId);
                $scope.rtcMultiConnection = $window.rtcMultiConnection;
                $scope.allUsernames = $window.allUsernames;
              });
            }
          }
      );

      $scope.$on('$destroy', function () {
        if ($scope.allUsernames.length === 1) {
          console.log("Room is vacant... clearing the room");
          Room.removeRoom({uuid: $scope.roomId})
        }
        $scope.rtcMultiConnection.leave();
      });

    

  });