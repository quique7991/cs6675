angular.module('MyApp')
  .controller('tempRoomCtrl', function($scope, $window, $rootScope,$location, $auth,$alert,GetUsers, Room) {

var scripts = [
  'https://www.webrtc-experiment.com/RTCMultiConnection-v1.8.js',
  'linkify.js',
  'ui.main.js',
  'ui.peer-connection.js',
  'ui.share-files.js',
  'ui.users-list.js',
  'ui.settings.js'
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


    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };

    $scope.removeRoom = function() {
      console.log("in remove room")
      console.log($rootScope.roomid)
      Room.removeRoom({
        uuid: $rootScope.roomid
      }).success(function() {
            $location.path('/#/');
          })
    };

    

  });