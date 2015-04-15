// Muaz Khan         - www.MuazKhan.com
// MIT License       - www.WebRTC-Experiment.com/licence
// Experiments       - github.com/muaz-khan/WebRTC-Experiment

var settingsPanel = getElement('.settings-panel');
getElement('#settings').onclick = function() {
    settingsPanel.style.display = 'block';
};

getElement('#save-settings').onclick = function() {
    settingsPanel.style.display = 'none';

    rtcMultiConnection.bandwidth.audio = getElement('#audio-bandwidth').value;
    rtcMultiConnection.bandwidth.video = getElement('#video-bandwidth').value;

    /*
    rtcMultiConnection.sdpConstraints.mandatory = {
        OfferToReceiveAudio: !!getElement('#OfferToReceiveAudio').checked,
        OfferToReceiveVideo: !!getElement('#OfferToReceiveVideo').checked,
        IceRestart: !!getElement('#IceRestart').checked
    };
    */

    var videWidth = getElement('#video-width').value;
    var videHeight = getElement('#video-height').value;
    rtcMultiConnection.mediaConstraints.mandatory = {
        minWidth: videWidth,
        maxWidth: videWidth,
        minHeight: videHeight,
        maxHeight: videHeight
    };
};