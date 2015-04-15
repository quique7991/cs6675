angular.module('MyApp', ['ngResource', 'ngMessages', 'ui.router', 'mgcrea.ngStrap', 'satellizer','ui.bootstrap'])
  .config(function($stateProvider, $urlRouterProvider, $authProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'partials/home.html',
        controller: 'HomeCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'partials/login.html',
        controller: 'LoginCtrl'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'partials/signup.html',
        controller: 'SignupCtrl'
      })
      .state('logout', {
        url: '/logout',
        template: null,
        controller: 'LogoutCtrl'
      })
      .state('addfriend',{
        url: '/addfriend',
        templateUrl: 'partials/addfriend.html',
        controller: 'FriendCtrl'

      })
       .state('room',{
        url: '/room',
        templateUrl: 'partials/room.html',
        controller: 'RoomCtrl'

      })
       .state('webrtc',{
        url: '/webrtc/:roomId',
        templateUrl: 'indexRoom.html',
        controller: 'tempRoomCtrl'

      })
       .state('roomtemp',{
        url: '/roomtemp',
        templateUrl: 'partials/tempRoom.html',
        controller: 'tempRoomCtrl'

      })
      .state('profile', {
        url: '/profile',
        templateUrl: 'partials/profile.html',
        controller: 'ProfileCtrl',
        resolve: {
          authenticated: function($q, $location, $auth) {
            var deferred = $q.defer();

            if (!$auth.isAuthenticated()) {
              $location.path('/login');
            } else {
              deferred.resolve();
            }

            return deferred.promise;
          }
        }
      });

    $urlRouterProvider.otherwise('/');


 
  });
