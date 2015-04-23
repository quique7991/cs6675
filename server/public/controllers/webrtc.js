angular.module('MyApp')
  .controller('webRTCCtrl', function ($scope, $stateParams, $state, $interval, $auth, Account, Room) {

    var SIGNALING_SERVER = (location.protocol == 'https:' ? 'wss' : 'ws') + '://'+ document.domain +':12034/';
    var STREAMING_USERS_LIMIT = 4;

    // values for message.type to be used for custom messages
    var MESSAGE_TYPE_NEW_VIEWER = 1;

    /*
     * TEST
     */
    var testUser = { email: "max@gmail.com " + Math.random() };


    var connection;

    $scope.roomId = $stateParams.roomId;
    $scope.wantsToStream = $stateParams.sharing === 'true';
    $scope.streamingUsers = [];
    $scope.streamingUsersLimit = STREAMING_USERS_LIMIT;
    $scope.isStreaming = false;
    $scope.streamid = null;
    $scope.clickVideoIcon = clickVideoIcon;

    Account.getProfile().then(function success(response) {
      $scope.user = response.data;
      setup();
      $scope.$on('$destroy', function () {
        console.log("DESTROYing...");
        teardown();
      });
    });


    function teardown() {
      console.log('Exiting room...');
      ['vid1', 'vid2', 'vid3', 'vid4'].forEach(function (id) {
        var elem = document.getElementById(id);
        if (elem.firstChild) {
          console.log("ATTEMPTING TO REMOVE CHILD", elem.firstChild);
          elem.removeChild(elem.firstChild);
        }
      });
      $scope.streamingUsers = [];
      $scope.isStreaming = false;
      $scope.streamid = null;
      if ($scope.streamingUsers.length == 0 && $scope.wantsToStream) {
        console.log('Last streamer in the room');
        console.warn('TODO: clear from DB');
        Room.removeRoom({uuid: $scope.roomId});
        connection.close();
      } else {
        connection.leave();
      }
    }

    console.log('$stateParams.sharing', $stateParams.sharing);
    function clickVideoIcon() {
      console.log("trying to RELOAD page...");
      teardown();
      $state.go($state.current, { roomId: $scope.roomId, sharing: 'true'});
      /*
       OLD BROKEN STUFF
       */
      /*
      if (!$scope.wantsToStream) {
        $scope.wantsToStream = true;
        teardown();
        setup();
      } else {
        $scope.wantsToStream = false;
        teardown();
        setup();
      }
      */
    }

    function setup() {
      connection = new RTCMultiConnection();
      configConnection(connection);
      console.warn("don't forget to change back to $scope.user");

      enterRoom(connection, $scope.user, $scope.roomId);
      //enterRoom(connection, $scope.user, $scope.roomId);
    }

    /*
    setTimeout(function () {
      console.log("About to kill connection...");
      if (connection.isInitiator) {
        console.log("...abort kill b/c initiator");
        return;
      }

      teardown();

      console.log("About to restart new connection...");
      setTimeout(function () {
        connection = new RTCMultiConnection();
        configConnection(connection);
        enterRoom(connection, testUser, $scope.roomId);
      }, 5000);
    }, 5000);
    */



    function configConnection(connection) {
      configureIceServers(connection);
      setupSignalingChannel(connection);

      connection.dontOverrideSession = true;

      connection.session = {
        video: true,
        audio: false,
        oneway: !$scope.wantsToStream
      };

      // setup callbacks
      connection.onNewSession = onNewSession;
      //connection.onRequest = onRequest;
      connection.onstream = onStream;
      connection.onstreamended = onStreamEnded;
      connection.onleave = onLeave;
      connection.onclose = onLeave;

      console.log("Finished configuring connection", connection);
    }

    function onNewSession(session) {
      console.log("onNewSession", session);
      session.join({
        video: $scope.wantsToStream
      });
    }

    // from other
    function onStream(evt) {
      console.log("onStream", evt);

      if (!evt.isVideo) {
        console.log("onStream was given non-video data");
        return;
      }

      /*
       *
       *
       *
       *
       *
       *
       */
      if (alreadyReceivedStream(evt.extra.user)) {
        console.warn("receiving same stream again!", evt.extra.user, $scope.streamingUsers);
        return;
      }

      if (evt.extra.user.email === $scope.user.email
            && !$scope.wantsToStream) {
        console.warn('trying to stream when we dont want to stream!');
        return;
      }

      if ($scope.streamingUsers.length === $scope.streamingUsersLimit) {
        console.warn('streamingUsersLimit was reached!');
        return;
      }

      addStreamingUser(evt.extra.user, evt.streamid);
      addVideoElement(evt.mediaElement);
      //document.getElementById('testVideoContainer').appendChild(evt.mediaElement);
      //videos.appendChild(evt.mediaElement);
      if (evt.type == 'remote') {
        // because "viewer" joined room as "oneway:true"
        // initiator will NEVER share participants
        // to manually ask for participants;
        // call "askToShareParticipants" method.
        connection.askToShareParticipants();
      }
      // if you're moderator
      // if stream-type is 'remote'
      // if target user is broadcaster!
      if (connection.isInitiator && evt.type == 'remote' && !evt.session.oneway) {
        // call "shareParticipants" to manually share participants with all connected users!
        connection.shareParticipants({
          dontShareWith: evt.userid
        });
      }
    }

    function onStreamEnded(evt) {
      // evt.mediaElement
      console.log("onStreamEnded", evt);
      console.warn("onStreamEnded not finished!");

      removeStreamingUser(evt.extra.user);
      if (evt.mediaElement.parentNode) {
        evt.mediaElement.parentNode.removeChild(evt.mediaElement);
      }
    }

    function onLeave(evt) {
      console.log('onLeave', evt);
    }

    function enterRoom(connection, user, roomId) {
      console.log("enterRoom", connection, user, roomId);

      var username = user.email;
      var displayName = username;  // todo: use display name for logs
      /*
       *
       *
       *
       *
       *
       *
       */
      //addUsername(username);

      connection.extra = {
        user: user
      };

      connection.channel = roomId;

      var websocket = new WebSocket(SIGNALING_SERVER);
      websocket.onmessage = function(event) {
        console.log('enterRoom --> websocket.onmessage');

        var data = JSON.parse(event.data);
        if (data.isChannelPresent == false) {
          console.log("CALLING OPEN===", connection);
          $scope.wantsToStream = true;
          /*
          connection.open({
            sessionid: connection.channel,
            captureUserMediaOnDemand: false
          });
          */
          connection.open({
            sessionid: connection.channel
          });
          //connection.open();
        } else {
          console.log("CALLING JOIN===", connection);
          //connection.connect(connection.channel);
          connection.join(roomId);
        }
      };
      websocket.onopen = function() {
        console.log('enterRoom --> websocket.onopen');

        websocket.send(JSON.stringify({
          checkPresence: true,
          channel: roomId
        }));
      };
    }

    function addVideoElement(videoElement) {
      console.log('addVideoElement', videoElement);

      var videoContainerId = null;

      for (var i = 1; i <= 4; i++) {
        var elemId = 'vid' + i;
        if (!document.getElementById(elemId).firstChild) {
          document.getElementById(elemId).appendChild(videoElement);
          return;
        }
      }

      /*
      switch ($scope.streamingUsers.length) {
        case 1: videoContainerId = 'vid1'; break;
        case 2: videoContainerId = 'vid2'; break;
        case 3: videoContainerId = 'vid3'; break;
        case 4: videoContainerId = 'vid4'; break;
      }

      if (videoContainerId) {
        document.getElementById(videoContainerId).appendChild(videoElement);
      }*/
    }

    function alreadyReceivedStream(user) {
      for (var i = 0; i < $scope.streamingUsers.length; i++) {
        if ($scope.streamingUsers[i].email === user.email) {
          return true;
        }
      }
      return false;
    }

    function addStreamingUser(user, streamid) {
      console.log('addStreamingUser', user);
      $scope.streamingUsers.push(user);

      if (user.email === $scope.user.email) {
        $scope.isStreaming = true;
        $scope.streamid = streamid;
      }

      $scope.$apply();
    }

    function removeStreamingUser(user) {
      removeUserFromArray(user, $scope.streamingUsers);

      if (user.email === $scope.user.email) {
        $scope.isStreaming = false;
        $scope.streamid = null;
      }

      $scope.$apply();
    }

    function removeUserFromArray(user, usersArray) {
      for (var i = 0; i < usersArray.length; i++) {
        if (usersArray[i].email === user.email) {
          usersArray.splice(i, 1);
          return;
        }
      }
    }

    function configureIceServers(connection) {
      var stunServer = {
        url: 'stun:trixie.no-ip.info:12035'
      };
      var turnServer = {
        url: 'turn:trixie.no-ip.info:12035',
        credential: '123',
        username: 'abc'
      };
      connection.iceServers = [stunServer, turnServer];

      connection.getExternalIceServers = false;
      connection.candidates = {
        relay:     true,
        reflexive: true,
        host:      true
      };

      connection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: true,
        OfferToReceiveVideo: true
      };
    }

    function setupSignalingChannel(connection) {
      // using websockets for signaling!
      // https://github.com/muaz-khan/WebRTC-Experiment/tree/master/websocket-over-nodejs
      // var SIGNALING_SERVER = 'wss://wsnodejs.nodejitsu.com:443';
      connection.openSignalingChannel = function(config) {
        config.channel = config.channel || this.channel;
        var websocket = new WebSocket(SIGNALING_SERVER);
        websocket.channel = config.channel;
        websocket.onopen = function() {
          console.log('openSignalingChannel --> websocket.onopen');

          websocket.push(JSON.stringify({
            open: true,
            channel: config.channel
          }));
          if (config.callback)
            config.callback(websocket);
        };
        websocket.onmessage = function(event) {
          console.log('openSignalingChannel --> websocket.onmessage');
          config.onmessage(JSON.parse(event.data));
        };
        websocket.push = websocket.send;
        websocket.send = function(data) {
          if (websocket.readyState != 1) {
            return setTimeout(function() {
              websocket.send(data);
            }, 1000);
          }

          websocket.push(JSON.stringify({
            data: data,
            channel: config.channel
          }));
        };
      };
    }
  });