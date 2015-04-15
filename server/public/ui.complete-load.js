var allScriptsAreLoaded = false;
(function () {
    /*
     * We need a way to tell angular that the scripts are done loading,
     * because there is a $watch that needs to be triggered.
     */
    allScriptsAreLoaded = true;
    var webRtcPartial = getElement('#webRTCRoom');
    angular.element(webRtcPartial).scope().$apply();
})();

