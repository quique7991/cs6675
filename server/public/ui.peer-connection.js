// Muaz Khan         - www.MuazKhan.com
// MIT License       - www.WebRTC-Experiment.com/licence
// Experiments       - github.com/muaz-khan/WebRTC-Experiment

var rtcMultiConnection = new RTCMultiConnection();

rtcMultiConnection.session = { data: true };

// Add TURN server
var iceServers = [];
iceServers.push({
	url: 'stun:trixie.no-ip.info:12035'
});
iceServers.push({
	url: 'turn:trixie.no-ip.info:12035',
	credential: '123',
	username: 'abc'
});
/*
iceServers.push({
    url: 'turn:turn.bistri.com:80',
    credential: 'homeo',
    username: 'homeo'
});
iceServers.push({
    url: 'turn:turn.anyfirewall.com:443?transport=tcp',
    credential: 'webrtc',
    username: 'webrtc'
});
*/

// Setting up the RTCMulticonnection server
rtcMultiConnection.iceServers = iceServers;
rtcMultiConnection.getExternalIceServers = false;
rtcMultiConnection.candidates = {
	relay:     true,
	reflexive: true,
	host:      true
};

rtcMultiConnection.sdpConstraints.mandatory = {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
};

// using websockets for signaling!
// https://github.com/muaz-khan/WebRTC-Experiment/tree/master/websocket-over-nodejs
// var SIGNALING_SERVER = 'wss://wsnodejs.nodejitsu.com:443';
var SIGNALING_SERVER = (location.protocol == 'https:' ? 'wss' : 'ws') + '://'+ document.domain +':12034/';
rtcMultiConnection.openSignalingChannel = function(config) {
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
rtcMultiConnection.customStreams = { };

/*
// http://www.rtcmulticonnection.org/docs/fakeDataChannels/
rtcMultiConnection.fakeDataChannels = true;
if(rtcMultiConnection.UA.Firefox) {
rtcMultiConnection.session.data = true;
}
*/

rtcMultiConnection.autoTranslateText = false;

rtcMultiConnection.onopen = function(e) {
    getElement('#allow-webcam').disabled = false;
    getElement('#allow-mic').disabled = false;
    getElement('#share-files').disabled = false;
    getElement('#allow-screen').disabled = false;

    addNewMessage({
        header: e.extra.username,
        message: 'Data connection is opened between you and ' + e.extra.username + '.',
        userinfo: getUserinfo(rtcMultiConnection.blobURLs[rtcMultiConnection.userid], 'images/info.png'),
        color: e.extra.color
    });

    addUsername(e.extra.username);

    if (currentlyStreaming) {
        console.log("TRYING TO RENEGOTIATE");
        console.log(rtcMultiConnection.peers, e);
        rtcMultiConnection.peers[e.userid].addStream({
            video: true,
            oneway: true
        });
    }
};

var whoIsTyping = document.querySelector('#who-is-typing');
rtcMultiConnection.onmessage = function(e) {
    if (e.data.typing) {
        whoIsTyping.innerHTML = e.extra.username + ' is typing ...';
        return;
    }

    if (e.data.stoppedTyping) {
        whoIsTyping.innerHTML = '';
        return;
    }

    whoIsTyping.innerHTML = '';

    addNewMessage({
        header: e.extra.username,
        message: 'Text message from ' + e.extra.username + ':<br /><br />' + (rtcMultiConnection.autoTranslateText ? linkify(e.data) + ' ( ' + linkify(e.original) + ' )' : linkify(e.data)),
        userinfo: getUserinfo(rtcMultiConnection.blobURLs[e.userid], 'images/chat-message.png'),
        color: e.extra.color
    });
    document.title = e.data;
};

var sessions = { };
rtcMultiConnection.onNewSession = function(session) {
    if (sessions[session.sessionid]) return;
    sessions[session.sessionid] = session;

    session.join();

    addNewMessage({
        header: session.extra.username,
        message: 'Making handshake with room owner....!',
        userinfo: '<img src="images/action-needed.png">',
        color: session.extra.color
    });
};

rtcMultiConnection.onRequest = function(request) {
    rtcMultiConnection.accept(request);
    addNewMessage({
        header: 'New Participant',
        message: 'A participant found. Accepting request of ' + request.extra.username + ' ( ' + request.userid + ' )...',
        userinfo: '<img src="images/action-needed.png">',
        color: request.extra.color
    });
};

rtcMultiConnection.onCustomMessage = function(message) {
    if (message.hasCamera || message.hasScreen) {
        message.session.oneway = true;
        rtcMultiConnection.sendMessage({
            renegotiate: true,
            streamid: message.streamid,
            session: message.session
        });
        return;

        addNewMessage({
            header: message.extra.username,
            message: msg,
            userinfo: '<img src="images/action-needed.png">',
            color: message.extra.color,
            callback: function(div) {
                div.querySelector('#preview').onclick = function() {
                    this.disabled = true;


                };

                div.querySelector('#share-your-cam').onclick = function() {
                    this.disabled = true;

                    if (!message.hasScreen) {
                        session = { audio: true, video: true };

                        rtcMultiConnection.captureUserMedia(function(stream) {
                            rtcMultiConnection.renegotiatedSessions[JSON.stringify(session)] = {
                                session: session,
                                stream: stream
                            }
                        
                            rtcMultiConnection.peers[message.userid].peer.connection.addStream(stream);
                            div.querySelector('#preview').onclick();
                        }, session);
                    }

                    if (message.hasScreen) {
                        var session = { screen: true };

                        rtcMultiConnection.captureUserMedia(function(stream) {
                            rtcMultiConnection.renegotiatedSessions[JSON.stringify(session)] = {
                                session: session,
                                stream: stream
                            }
                            
                            rtcMultiConnection.peers[message.userid].peer.connection.addStream(stream);
                            div.querySelector('#preview').onclick();
                        }, session);
                    }
                };
            }
        });
    }

    if (message.hasMic) {
        addNewMessage({
            header: message.extra.username,
            message: message.extra.username + ' enabled microphone. <button id="listen">Listen</button> ---- <button id="share-your-mic">Share Your Mic</button>',
            userinfo: '<img src="images/action-needed.png">',
            color: message.extra.color,
            callback: function(div) {
                div.querySelector('#listen').onclick = function() {
                    this.disabled = true;
                    message.session.oneway = true;
                    rtcMultiConnection.sendMessage({
                        renegotiate: true,
                        streamid: message.streamid,
                        session: message.session
                    });
                };

                div.querySelector('#share-your-mic').onclick = function() {
                    this.disabled = true;

                    var session = { audio: true };

                    rtcMultiConnection.captureUserMedia(function(stream) {
                        rtcMultiConnection.renegotiatedSessions[JSON.stringify(session)] = {
                            session: session,
                            stream: stream
                        }
                        
                        rtcMultiConnection.peers[message.userid].peer.connection.addStream(stream);
                        div.querySelector('#listen').onclick();
                    }, session);
                };
            }
        });
    }

    if (message.renegotiate) {
        var customStream = rtcMultiConnection.customStreams[message.streamid];
        if (customStream) {
            rtcMultiConnection.peers[message.userid].renegotiate(customStream, message.session);
        }
    }
};


rtcMultiConnection.blobURLs = { };
rtcMultiConnection.onstream = function(e) {
    /*
     * Currently, this is how we prevent multiple
     * copies of our own stream when we attempt to
     * addStream to new viewers in onopen() event
     */
    if (e.userid === rtcMultiConnection.userid
            && currentlyStreaming) {
        return;
    }


    if (e.stream.getVideoTracks().length) {
        rtcMultiConnection.blobURLs[e.userid] = e.blobURL;
        /*
        if( document.getElementById(e.userid) ) {
            document.getElementById(e.userid).muted = true;
        }
        */
        addNewMessage({
            header: e.extra.username,
            message: e.extra.username + ' enabled webcam.',
            userinfo: '<video id="' + e.userid + '" src="' + URL.createObjectURL(e.stream) + '" autoplay muted=true volume=0></vide>',
            color: e.extra.color
        });

        if (e.userid === rtcMultiConnection.userid) {
            currentlyStreaming = true;
        }
    } else {
        addNewMessage({
            header: e.extra.username,
            message: e.extra.username + ' enabled microphone.',
            userinfo: '<audio src="' + URL.createObjectURL(e.stream) + '" controls muted=true volume=0></vide>',
            color: e.extra.color
        });
    }

    addStreamerUsername(e.extra.username);
    appendVideoElement(e.mediaElement);
    //usersContainer.appendChild(e.mediaElement);
};

rtcMultiConnection.sendMessage = function(message) {
    message.userid = rtcMultiConnection.userid;
    message.extra = rtcMultiConnection.extra;
    rtcMultiConnection.sendCustomMessage(message);
};

rtcMultiConnection.onclose = rtcMultiConnection.onleave = function(event) {
    addNewMessage({
        header: event.extra.username,
        message: event.extra.username + ' left the room.',
        userinfo: getUserinfo(rtcMultiConnection.blobURLs[event.userid], 'images/info.png'),
        color: event.extra.color
    });

    removeUsername(event.extra.username);
    console.log("Remaining usernames", allUsernames);
};
