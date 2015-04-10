angular.module('MyApp')
  .controller('FriendCtrl', function($scope, $auth, $alert, Account,GetUsers) {

    

  	 $scope.isAuthenticated = function() {
      return $auth.isAuthenticated();
    };

     $scope.getUsersList = function() {
      GetUsers.getUsersList($scope.email)
        .success(function(data) {
          $scope.returneduser = data;
        })
        .error(function(error) {
          $alert({
            content: error.message,
            animation: 'fadeZoomFadeDown',
            type: 'material',
            duration: 3
          });
        });
    };

    $scope.addFriend = function() {
      console.log($scope.returneduser.displayName)
      GetUsers.addNewFriend({
        curremail: $scope.user.email,
        email: $scope.email,
        fname: $scope.returneduser.displayName
      }).then(function() {
        $alert({
          content: 'Friend has been added',
          animation: 'fadeZoomFadeDown',
          type: 'material',
          duration: 3
          });
        });
    };

    $scope.getFriendList = function() {
      console.log('Getting friend list');
      Account.getProfile()
        .success(function(data) {
          $scope.user = data;
          console.log('User is', data);
          GetUsers.getFriends($scope.user.email)
          .success(function(data) {
          console.log('Friends are', data);
            $scope.returnedfriends = data;
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

    $scope.getFriendList();

  });
