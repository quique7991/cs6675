angular.module('MyApp')
  .factory('GetUsers', function($http) {
    return {
      getUsersList: function(email) {
        return $http.get('/api/users/'+email);
      },
      addNewFriend: function(inputData) {
        return $http.post('/api/friends',inputData);
      },
      getFriends: function(email){
        return $http.get('/api/friends/'+email);
      },
      updateLocation:function(inputData){
        return $http.put('/api/location',inputData);
      }


    };
  });