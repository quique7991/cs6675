angular.module('MyApp')
  .controller('webRTCCtrl', function ($scope, $stateParams, $auth, Account, Room) {

    var SIGNALING_SERVER = (location.protocol == 'https:' ? 'wss' : 'ws') + '://'+ document.domain +':12034/';


    $scope.roomId = $stateParams.roomId;

    var connection = new RTCMultiConnection($scope.roomId);
    configConnection(connection);


    /*
     * TEST
     */
    var testUser = { email: "max@gmail.com" };
    enterRoom(connection, testUser, $scope.roomId);

    $scope.$on('$destroy', teardown);


    function teardown() {
      console.log('Exiting room...');
      connection.leave();
    }




    function configConnection(connection) {
      configureIceServers(connection);
      setupSignalingChannel(connection);

      connection.session = {
        video: true,
        audio: false
      };

      // setup callbacks
      connection.onNewSession = onNewSession;
      connection.onstream = onStream;
      connection.onleave = onLeave;
      connection.onclose = onLeave;

      console.log("Finished configuring connection", connection);
    }

    var sessions = { };
    function onNewSession(session) {
      console.log("onNewSession", session);

      if (sessions[session.sessionid]) {
        return;
      }

      sessions[session.sessionid] = session;
      session.join();
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
        username: username
      };

      connection.channel = roomId;

      var websocket = new WebSocket(SIGNALING_SERVER);
      websocket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        if (data.isChannelPresent == false) {
          connection.open();
        } else {
          connection.join(roomId);
        }
      };
      websocket.onopen = function() {
        websocket.send(JSON.stringify({
          checkPresence: true,
          channel: roomId
        }));
      };
    }

    var count = 0;
    function addVideoElement(videoElement) {
      console.log('addVideoElement', videoElement);

      var vid1 = document.getElementById('vid1');
      var vid2 = document.getElementById('vid2');
      if (count === 0) {
        vid1.appendChild(videoElement);
        count = 1;
      } else {
        vid2.appendChild(videoElement);
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
          websocket.push(JSON.stringify({
            open: true,
            channel: config.channel
          }));
          if (config.callback)
            config.callback(websocket);
        };
        websocket.onmessage = function(event) {
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