console.log('In main.js!');

let mapPeers = {};

const usernameInput = document.querySelector('#username');
const btnJoin = document.querySelector('#btn-join');
const localVideo = document.querySelector("#local-video");
const btnToggleAudio = document.querySelector("#btn-toggle-audio");
const btnToggleVideo = document.querySelector("#btn-toggle-video");
const messageList = document.querySelector('#messages-list');
const btnSendMsg = document.querySelector('#btn-send-msg');
const msgInput = document.querySelector('#msg-input');

let username;
let webSocket;
let chatSocket;
let localStream = new MediaStream();
let channelName = null;  // Để phân biệt người gửi

btnJoin.addEventListener('click', () => {
    username = usernameInput.value.trim();
    if (!username) return;

    usernameInput.disabled = true;
    btnJoin.disabled = true;
    document.querySelector('#label-username').innerHTML = username;

    const loc = window.location;
    const wsStart = loc.protocol === 'https:' ? 'wss://' : 'ws://';
    const signalingEndPoint = wsStart + loc.host + '/ws/';
    const chatEndPoint = wsStart + loc.host + '/chat/';

    // WebRTC signaling WebSocket
    webSocket = new WebSocket(signalingEndPoint);
    webSocket.addEventListener('open', () => {
        console.log('Signaling connection opened!');
        sendSignal('new-peer', {});
    });
    webSocket.addEventListener('message', webSocketOnMessage);
    webSocket.addEventListener('close', () => console.log('Signaling connection closed!'));
    webSocket.addEventListener('error', () => console.log('Signaling error occurred!'));

    // Chat WebSocket
    chatSocket = new WebSocket(chatEndPoint);
    chatSocket.addEventListener('open', () => {
        console.log("Chat WebSocket connected!");
    });

    chatSocket.addEventListener('message', (e) => {
        let data = JSON.parse(e.data);

        if (!channelName && data.message?.receiver_channel_name) {
            channelName = data.message.receiver_channel_name;
        }

        if (data.action === 'new-message') {
            let msg = data.message.text || '';
            let from = data.message.receiver_channel_name === channelName ? 'You' : 'Stranger';

            let listItem = document.createElement('li');
            listItem.textContent = `${from}: ${msg}`;
            messageList.appendChild(listItem);
        }
    });
});

navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        localStream = stream;
        localVideo.srcObject = localStream;
        localVideo.muted = true;

        const audioTracks = stream.getAudioTracks();
        const videoTracks = stream.getVideoTracks();

        btnToggleAudio.addEventListener('click', () => {
            audioTracks[0].enabled = !audioTracks[0].enabled;
            btnToggleAudio.innerHTML = audioTracks[0].enabled ? "Audio Mute" : "Audio Unmute";
        });

        btnToggleVideo.addEventListener('click', () => {
            videoTracks[0].enabled = !videoTracks[0].enabled;
            btnToggleVideo.innerHTML = videoTracks[0].enabled ? "Video Off" : "Video On";
        });
    })
    .catch(err => console.error("Error accessing media devices.", err));

btnSendMsg.addEventListener('click', () => {
    const message = msgInput.value.trim();
    if (!message) return;

    let data = {
        action: 'new-message',
        message: {
            text: message
        }
    };

    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
        chatSocket.send(JSON.stringify(data));
    }

    const li = document.createElement('li');
    li.appendChild(document.createTextNode('Me: ' + message));
    messageList.appendChild(li);

    for (let [peerUsername, peerData] of Object.entries(mapPeers)) {
        const dataChannel = peerData[1];
        dataChannel.send(message);
    }

    msgInput.value = '';
});

function sendSignal(action, message) {
    if (webSocket.readyState === WebSocket.OPEN) {
        const jsonStr = JSON.stringify({
            'peer': username,
            'action': action,
            'message': message
        });
        webSocket.send(jsonStr);
    } else {
        console.error("WebSocket is not open.");
    }
}

function webSocketOnMessage(event) {
    const parsedData = JSON.parse(event.data);
    const peerUsername = parsedData['peer'];
    const action = parsedData['action'];
    const message = parsedData['message'];

    if (username === peerUsername) return;

    const receiver_channel_name = message['receiver_channel_name'];

    if (action === 'new-peer') {
        createOfferer(peerUsername, receiver_channel_name);
    } else if (action === 'new-offer') {
        const offer = new RTCSessionDescription(message['sdp']);
        createAnswerer(offer, peerUsername, receiver_channel_name);
    } else if (action === 'new-answer') {
        const answer = new RTCSessionDescription(message['sdp']);
        const peer = mapPeers[peerUsername][0];
        peer.setRemoteDescription(answer);
    }
}

function createOfferer(peerUsername, receiver_channel_name) {
    const peer = new RTCPeerConnection(null);
    addLocalTracks(peer);

    const dc = peer.createDataChannel('channel');
    dc.addEventListener('open', () => console.log('Connection opened!'));
    dc.addEventListener('message', dcOnMessage);

    const remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    mapPeers[peerUsername] = [peer, dc];

    peer.addEventListener("iceconnectionstatechange", () => {
        const state = peer.iceConnectionState;
        if (['failed', 'disconnected', 'closed'].includes(state)) {
            delete mapPeers[peerUsername];
            if (state !== 'closed') peer.close();
            removeRemoteVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', event => {
        if (!event.candidate) {
            sendSignal('new-offer', {
                'sdp': peer.localDescription,
                'receiver_channel_name': receiver_channel_name
            });
        }
    });

    peer.createOffer()
        .then(o => peer.setLocalDescription(o))
        .then(() => console.log('Local description set successfully.'));
}

function createAnswerer(offer, peerUsername, receiver_channel_name) {
    const peer = new RTCPeerConnection(null);
    addLocalTracks(peer);

    const remoteVideo = createVideo(peerUsername);
    setOnTrack(peer, remoteVideo);

    peer.addEventListener('datachannel', e => {
        peer.dc = e.channel;
        peer.dc.addEventListener('open', () => console.log('Connection opened!'));
        peer.dc.addEventListener('message', dcOnMessage);

        mapPeers[peerUsername] = [peer, peer.dc];
    });

    peer.addEventListener("iceconnectionstatechange", () => {
        const state = peer.iceConnectionState;
        if (['failed', 'disconnected', 'closed'].includes(state)) {
            delete mapPeers[peerUsername];
            if (state !== 'closed') peer.close();
            removeRemoteVideo(remoteVideo);
        }
    });

    peer.addEventListener('icecandidate', event => {
        if (!event.candidate) {
            sendSignal('new-answer', {
                'sdp': peer.localDescription,
                'receiver_channel_name': receiver_channel_name
            });
        }
    });

    peer.setRemoteDescription(offer)
        .then(() => peer.createAnswer())
        .then(a => peer.setLocalDescription(a))
        .then(() => console.log('Answer created and set as local description.'));
}

function addLocalTracks(peer) {
    localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
    });
}

function dcOnMessage(event) {
    const message = event.data;

    const li = document.createElement('li');
    li.appendChild(document.createTextNode('Stranger: ' + message));
    messageList.appendChild(li);
}

function createVideo(peerUsername) {
    const videoContainer = document.querySelector('#video-container');

    const remoteVideo = document.createElement('video');
    remoteVideo.id = `${peerUsername}-video`;
    remoteVideo.autoplay = true;
    remoteVideo.playsInline = true;
    remoteVideo.width = 300;

    const videoWrapper = document.createElement('div');
    videoWrapper.className = 'remote-video-wrapper';
    videoWrapper.appendChild(remoteVideo);

    const usernameDisplay = document.createElement('div');
    usernameDisplay.className = 'username-display';
    usernameDisplay.innerText = peerUsername;
    videoWrapper.appendChild(usernameDisplay);

    videoContainer.appendChild(videoWrapper);

    return remoteVideo;
}

function setOnTrack(peer, remoteVideo) {
    const remoteStream = new MediaStream();
    remoteVideo.srcObject = remoteStream;

    peer.addEventListener('track', (event) => {
        remoteStream.addTrack(event.track);
    });
}

function removeRemoteVideo(videoElement) {
    if (videoElement && videoElement.parentNode) {
        videoElement.parentNode.remove();
    }
}
