// Muaz Khan         - www.MuazKhan.com
// MIT License       - www.WebRTC-Experiment.com/licence
// Experiments       - github.com/muaz-khan/WebRTC-Experiment

function getElement(selector) {
    return document.querySelector(selector);
}

var main = getElement('.main');

function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.round(Math.random() * 15)];
    }
    return color;
}

function addNewMessage(args) {
    var newMessageDIV = document.createElement('div');
    newMessageDIV.className = 'new-message';

    /* Commenting out userinfo
    var userinfoDIV = document.createElement('div');
    userinfoDIV.className = 'user-info';
    userinfoDIV.innerHTML = args.userinfo || '<img src="images/user.png">';

    userinfoDIV.style.background = args.color || rtcMultiConnection.extra.color || getRandomColor();

    newMessageDIV.appendChild(userinfoDIV);
    */

    var userActivityDIV = document.createElement('div');
    userActivityDIV.className = 'user-activity';

    userActivityDIV.innerHTML = '<h2 class="header">' + args.header + '</h2>';

    var p = document.createElement('span');
    p.className = 'message';
    userActivityDIV.appendChild(p);
    p.innerHTML = args.message;

    newMessageDIV.appendChild(userActivityDIV);

    main.insertBefore(newMessageDIV, main.firstChild);

    /*
    userinfoDIV.style.height = newMessageDIV.clientHeight + 'px';
    */

    if (args.callback) {
        args.callback(newMessageDIV);
    }

    document.querySelector('#message-sound').play();
}

/*
main.querySelector('#continue').onclick = function () {
    var yourName = this.parentNode.querySelector('#your-name');
    var roomName = this.parentNode.querySelector('#room-name');

    var username = yourName.value;
    var roomId = roomName.value;
    continueclick(username, roomId);
};
*/

function continueclick(user, roomId) {
    var username = user.email;
    var displayName = username;  // todo: use display name for logs
    addUsername(username);

    rtcMultiConnection.extra = {
        username: username,
        color: getRandomColor()
    };

    addNewMessage({
        header: displayName,
        message: 'Searching for existing rooms...',
        userinfo: '<img src="images/action-needed.png">'
    });

    rtcMultiConnection.channel = roomId;

    var websocket = new WebSocket(SIGNALING_SERVER);
    websocket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        if (data.isChannelPresent == false) {
            addNewMessage({
                header: displayName,
                message: 'No room found.  Creating room ' + roomId + '...',
                userinfo: '<img src="images/action-needed.png">'
            });

            rtcMultiConnection.open();
        } else {
            addNewMessage({
                header: displayName,
                message: 'Room found. Joining the room...',
                userinfo: '<img src="images/action-needed.png">'
            });
            rtcMultiConnection.join(roomId);
        }
    };
    websocket.onopen = function() {
        websocket.send(JSON.stringify({
            checkPresence: true,
            channel: roomId
        }));
    };
};

function getUserinfo(blobURL, imageURL) {
    return blobURL ? '<video src="' + blobURL + '" autoplay controls></video>' : '<img src="' + imageURL + '">';
}

var isShiftKeyPressed = false;

var currentlyStreaming = false;
getElement('#allow-webcam').onclick = function() {
    if (currentlyStreaming) {
        return;
    }
    //currentlyStreaming = true;

    this.disabled = true;

    var session = { audio: true, video: true };

    rtcMultiConnection.captureUserMedia(function(stream) {
        var streamid = rtcMultiConnection.token();
        rtcMultiConnection.customStreams[streamid] = stream;

        rtcMultiConnection.sendMessage({
            hasCamera: true,
            streamid: streamid,
            session: session
        });
    }, session);
};

getElement('#allow-mic').onclick = function() {
    this.disabled = true;
    var session = { audio: true };

    rtcMultiConnection.captureUserMedia(function(stream) {
        var streamid = rtcMultiConnection.token();
        rtcMultiConnection.customStreams[streamid] = stream;

        rtcMultiConnection.sendMessage({
            hasMic: true,
            streamid: streamid,
            session: session
        });
    }, session);
};

getElement('#allow-screen').onclick = function() {
    this.disabled = true;
    var session = { screen: true };

    rtcMultiConnection.captureUserMedia(function(stream) {
        var streamid = rtcMultiConnection.token();
        rtcMultiConnection.customStreams[streamid] = stream;

        rtcMultiConnection.sendMessage({
            hasScreen: true,
            streamid: streamid,
            session: session
        });
    }, session);
};

getElement('#share-files').onclick = function() {
    var file = document.createElement('input');
    file.type = 'file';

    file.onchange = function() {
        rtcMultiConnection.send(this.files[0]);
    };
    fireClickEvent(file);
};

function fireClickEvent(element) {
    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    element.dispatchEvent(evt);
}

function bytesToSize(bytes) {
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes == 0) return '0 Bytes';
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

/** New stuff */

var streamerUsernames = [];  // assumed to be unique!
var allUsernames = [];
var numbersOfStreamers = getElement('.numbers-of-streamers');
var MAX_STREAMERS = parseInt(getElement('#max-streamers').innerHTML);

var videoContainers = [
    getElement('#video1'),
    getElement('#video2'),
    getElement('#video3'),
    getElement('#video4')
];

// setup video click handlers
(function setupClickHandlers() {
    for (var i = 0; i < videoContainers.length; i++) {
        videoContainers[i].onclick = setAsPrimaryVideo;
    }
})();

function setAsPrimaryVideo() {
    console.log('on-video-click');
    var primaryContainer = getElement('.primary-video');
    if (this !== primaryContainer) {
        primaryContainer.className = 'secondary-video';
        this.className = 'primary-video';
    }
}

function addStreamerUsername(username) {
    if (streamerUsernames.indexOf(username) === -1) {
        streamerUsernames.push(username);
        addUsername(username);  // ensure streamers is subset of all
        updateNumbersOfStreamers();
    }
}

function removeStreamerUsername(username) {
    index = streamerUsernames.indexOf(username);
    if (index !== -1) {
        streamerUsernames.splice(index, 1);
        updateNumbersOfStreamers();
        updateVideoOrdering();
        updateVisibilityOfVideoContainers();
    }
}

function updateNumbersOfStreamers() {
    numbersOfStreamers.innerHTML = streamerUsernames.length;

    if (streamerUsernames.length >= MAX_STREAMERS) {
        setStreamAbility(false);
    } else if (!currentlyStreaming) {
        setStreamAbility(true);
    }
}

function addUsername(username) {
    if (allUsernames.indexOf(username) === -1) {
        allUsernames.push(username);
        updateNumbersOfUsers();
    }
}

function removeUsername(username) {
    index = allUsernames.indexOf(username);
    if (index !== -1) {
        allUsernames.splice(index, 1);
        removeStreamerUsername(username);  // ensure streamers is subset of all
        updateNumbersOfUsers();
    }
}

function updateNumbersOfUsers() {
    numbersOfUsers.innerHTML = allUsernames.length;
}

function setStreamAbility(bool) {
    getElement('#allow-webcam').disabled = !bool;
}

function appendVideoElement(mediaElement) {
    if (streamerUsernames.length > MAX_STREAMERS) {
        return;
    }

    for (var i = 0; i < videoContainers.length; i++) {
        if (!videoContainers[i].hasChildNodes()) {
            videoContainers[i].appendChild(mediaElement);
            break;
        }
    }
    updateVideoOrdering();
    updateVisibilityOfVideoContainers();
}

/* We have 4 video elements.
 *
 * If we have N streams, this ensures that
 * the first N elements are being occupied
 *
 */
function updateVideoOrdering() {
    var containersWithVideos = [];
    for (var i = 0; i < videoContainers.length; i++) {
        if (videoContainers[i].hasChildNodes()) {
            containersWithVideos.push(videoContainers[i]);
        }
    }

    var primaryVideoContainer = getElement('.primary-video');
    if (!primaryVideoContainer.hasChildNodes() && containersWithVideos.length > 0) {
        containersWithVideos[0].className = 'primary-video';
        primaryVideoContainer.className = 'secondary-video';
    }
}

function updateVisibilityOfVideoContainers() {
    for (var i = 0; i < videoContainers.length; i++) {
        vc = videoContainers[i];
        vc.style.display = vc.hasChildNodes() ? 'initial' : 'none';
    }
}