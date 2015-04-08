angular.module('MyApp')
  .factory('Room', function($http) {
    return {
      createRoom: function(inputData) {
        return $http.post('/api/room', inputData);
      },
      removeRoom: function(inputData) {
        return $http.post('/api/roomremove', inputData);
      },
      getRooms: function(email) {
        return $http.get('/api/room/'+email);
      }
    };
  });