angular.module('MyApp',['geolocation'])
  .controller('geoCtrl', function ($scope,geolocation) {

  	$scope.getUserLocation = function(){
  		 $scope.coords = geolocation.getLocation().then(function(data){
  		 	console.log(coords.latitude)
      		return {lat:data.coords.latitude, long:data.coords.longitude};
    	});
  	};
   
});