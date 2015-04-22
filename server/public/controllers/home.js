angular.module('MyApp')
  .controller('HomeCtrl', function($scope,$timeout, $window,$alert, $rootScope, $state, $auth, Account,GetUsers,Room) {


    $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };

    $scope.enterRoom = function (roomId, sharing) {
      $state.go('webrtc', {roomId: roomId, sharing: sharing});
    };

    $scope.getFriendRoomList = function() {
      /*$scope.friendinfo = {
        displayName: String,
        email: String,
        rooms: String
      }*/
      $scope.friendinfo = [];
      $scope.finalroominfo = [];
      roomFound = false;
      Account.getProfile()
        .success(function(data) {
          $scope.user = data;
          GetUsers.getFriends($scope.user.email)
        .success(function(data) {
          $scope.returnedfriends = data;
          Room.getRooms($scope.user.email)
          .success(function(roomdata){
            $scope.returnedrooms = roomdata;
            
            for (i =0; i < data[0].friends.length; i++){
              //console.log(data[0].friends[i].name)
              //console.log(data[0].friends[i].friend_email)

              if (roomdata.length == 0){
                $scope.friendinfo.push({
                  displayName: data[0].friends[i].name,
                  email: data[0].friends[i].friend_email,
                })
              }
              else{
                for (j=0; j < roomdata.length;j++){
                  if (roomdata[j].creater == data[0].friends[i].friend_email){
                  //console.log(roomdata[j].room_id)
                    tempRoom = roomdata[j].room_id;
                    tempRoomName = roomdata[j].room_displayName;
                    tempOwner = roomdata[j].creater
                    finalDistance = distance($scope.user.infos[0].currlocation[1],$scope.user.infos[0].currlocation[0],roomdata[j].room_location[1],roomdata[j].room_location[0])
                    finalDistance = finalDistance.toFixed(4)
                    roomFound = true;
                  }
                }
                if (roomFound == true){
                 $scope.friendinfo.push({
                  displayName: data[0].friends[i].name,
                  email: data[0].friends[i].friend_email,
                  rooms: tempRoom
                  })

                 $scope.finalroominfo.push({
                  roomName: tempRoomName,
                  roomId: tempRoom,
                  owner: tempOwner,
                  distance: finalDistance
                 })
                }
               else{
                $scope.friendinfo.push({
                  displayName: data[0].friends[i].name,
                  email: data[0].friends[i].friend_email,
                  //rooms: tempRoom
                })
                }
              }
            }
            for (j=0; j < roomdata.length;j++){
              if(roomdata[j].room_type == 'public'){
                
                //longitudeVal = $scope.user.infos[0].currlocation[0] - roomdata[j].room_location[0]
                //latitudeVal = $scope.user.infos[0].currlocation[1] - roomdata[j].room_location[1]
                finalDistance = distance($scope.user.infos[0].currlocation[1],$scope.user.infos[0].currlocation[0],roomdata[j].room_location[1],roomdata[j].room_location[0])
                finalDistance = finalDistance.toFixed(4)
                $scope.finalroominfo.push({
                  roomName: roomdata[j].room_displayName,
                  roomId: roomdata[j].room_id,
                  owner: roomdata[j].creater,
                  distance: finalDistance
                 })
              }
            }
            console.log($scope.finalroominfo)
            $scope.finalroominfo = remove_duplicates($scope.finalroominfo)
            console.log($scope.finalroominfo)
            console.log($scope.friendinfo)
          })
        })
        .error(function(error) {
          $alert({
            content: error.message,
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        });
        })
      
    };

    $scope.rowCollection = [];
    $scope.displayedCollection = [].concat($scope.rowCollection);

    $scope.getUserLocation = function(){
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(successCallback,errorCallback, {maximumAge:600000});
        }
        else {
                $scope.error = "Geolocation is not supported by this browser.";
            }
    };

    function remove_duplicates(objectsArray) {
       var usedObjects = {};

      for (var i=objectsArray.length - 1;i>=0;i--) {
        var so = JSON.stringify(objectsArray[i]);

        if (usedObjects[so]) {
            objectsArray.splice(i, 1);

        } else {
            usedObjects[so] = true;          
        }
      }

      return objectsArray;

    }

    function distance(lat1, lon1, lat2, lon2) {
        var radlat1 = Math.PI * lat1/180
        var radlat2 = Math.PI * lat2/180
        var radlon1 = Math.PI * lon1/180
        var radlon2 = Math.PI * lon2/180
        var theta = lon1-lon2
        var radtheta = Math.PI * theta/180
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist)
        dist = dist * 180/Math.PI
        dist = dist * 60 * 1.1515
        
        return dist
}

 

   function successCallback(position) {
    $timeout(function() {
    $scope.latitude = position.coords.latitude;
    $scope.longitude = position.coords.longitude;
    console.log($scope.latitude)
    console.log($scope.longitude)
    GetUsers.updateLocation({
        email: $scope.user.email,
        
        lon: $scope.longitude,
        lat: $scope.latitude
      }).then(function() {
        $alert({
          content: 'Location has been updated',
          animation: 'fadeZoomFadeDown',
          type: 'material',
          duration: 3
          });
        });
    });
    }

   function errorCallback(error) {
    }

    $scope.getFriendRoomList();

  });