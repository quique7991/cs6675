angular.module('MyApp')
  .controller('RoomCtrl', function($scope, $window, $rootScope,$location,$state, $auth,$alert, Account,GetUsers, Room) {

   // $scope.uuid = "aaaaaaa";

    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };

    $scope.getRoomInformation = function(){
      console.log($scope.typename)
      console.log($scope.tag)
      Account.getProfile()
        .success(function(data) {
          $scope.user = data;
          Room.createRoom({
          roomId: $scope.uuid,
          roomName: $scope.tag,
          roomType: $scope.typename,
          creater: $scope.user.email,
          roomLocation:$scope.user.infos[0].currlocation
          }).success(function() {
            $rootScope.roomid = $scope.uuid;
            $state.go('webrtc', {roomId: $scope.uuid, sharing: 'true'});
            //$location.path('/webrtc/' + $scope.uuid + '?sharing=true');
          })
      })
      .then(function() {
        $alert({
          content: 'Room has been created',
          animation: 'fadeZoomFadeDown',
          type: 'material',
          duration: 3
          });
        });
    };


    $scope.getUniqueId = function(){
      $scope.uuid = generateUUID();
   
    };

    function generateUUID() {
     var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = (d + Math.random()*16)%16 | 0;
        d = Math.floor(d/16);
        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });
        return uuid;
    };



    $scope.getUniqueId();

  });