angular.module('MyApp')
  .controller('tempRoomCtrl', function($scope, $window, $rootScope,$location, $auth,$alert,GetUsers, Room) {


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