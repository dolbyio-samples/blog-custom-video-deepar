// Specify the version of DeepAR and where to download it
const deepARRoot = 'https://cdn.jsdelivr.net/npm/deepar@4.0.1';

// Provide your DeepAR license key
const DEEP_AR_LICENSE_KEY = '';

// Generate a client access token from the Dolby.io dashboard and insert into ACCESS_TOKEN variable
const ACCESS_TOKEN = '';

// Update the login message with the name of the user
const names = ['Alison', 'Kendra', 'Azaria', 'Evaline', 'Fredrick', 'Lexi', 'Cyprian', 'Audrey'];
let randomName = names[Math.floor(Math.random() * names.length)];

// DeepAR effects
// https://docs.deepar.ai/deepar-sdk/deep-ar-sdk-for-web/getting-started/
const effects = [
  './effects/8bitHearts.deepar',
  './effects/Elephant_Trunk.deepar',
  './effects/Emotion_Meter.deepar',
  './effects/Emotions_Exaggerator.deepar',
  './effects/Fire_Effect.deepar',
  './effects/Hope.deepar',
  './effects/Humanoid.deepar',
  './effects/MakeupLook.deepar',
  './effects/Neon_Devil_Horns.deepar',
  './effects/Ping_Pong.deepar',
  './effects/Snail.deepar',
  './effects/Split_View_Look.deepar',
  './effects/Stallone.deepar',
  './effects/Vendetta_Mask.deepar',
  './effects/burning_effect.deepar',
  './effects/flower_face.deepar',
  './effects/galaxy_background.deepar',
  './effects/viking_helmet.deepar',
];

let currentEffectIdx = -1;

let deepAR = null;

const inputLicense = document.getElementById('deepar-license');
const inputAccessToken = document.getElementById('dolbyio-access-token');
const btnInitDeepAr = document.getElementById('btn-init-deepar');
const btnInitDolbyIo = document.getElementById('btn-init-dolbyio');
const appElement = document.getElementById('app');
const btnJoin = document.getElementById('btn-join');
const inputConferenceAlias = document.getElementById('alias-input');
const btnLeave = document.getElementById('btn-leave');
const btnChangeEffect = document.getElementById('btn-change-effect');
const btnStartVideo = document.getElementById('btn-start-video');
const btnStopVideo = document.getElementById('btn-stop-video');
const canvasLocalVideo = document.getElementById('local-video');

btnInitDeepAr.onclick = async () => {
  // Initialize DeepAR SDK
  // https://s3.eu-west-1.amazonaws.com/sdk.developer.deepar.ai/doc/web/classes/DeepAR.html#constructor
  deepAR = new DeepAR({
    licenseKey: inputLicense.value,
    canvas: canvasLocalVideo,
    deeparWasmPath: `${deepARRoot}/wasm/deepar.wasm`,
    callbacks: {
      onInitialize: () => {
        deepAR.startVideo(true);
      },
    },
    segmentationConfig: {
      modelPath: `${deepARRoot}/models/segmentation/segmentation-160x160-opt.bin`,
    },
  });

  deepAR.downloadFaceTrackingModel(`${deepARRoot}/models/face/models-68-extreme.bin`);

  // Hide the DeepAR form
  document.getElementById('form-deepar').setAttribute('style', 'display: none;');
  if (inputAccessToken.value && inputAccessToken.value.length) {
    appElement.removeAttribute('style');
  }
};

btnInitDolbyIo.onclick = async () => {
  // Initialize the Dolby.io SDK
  // Please read the documentation at:
  // https://docs.dolby.io/communications-apis/docs/initializing-javascript
  VoxeetSDK.initializeToken(inputAccessToken.value, (isExpired) => {
    return new Promise((resolve, reject) => {
      if (isExpired) {
        reject('The access token has expired.');
      } else {
        resolve(inputAccessToken.value);
      }
    });
  });

  // Open a session for the user
  await VoxeetSDK.session.open({ name: randomName });

  const nameMessage = document.getElementById('name-message');
  nameMessage.innerHTML = `You are logged in as ${randomName}`;

  // Hide the Dolby.io form
  document.getElementById('form-dolbyio').setAttribute('style', 'display: none;');
  if (inputLicense.value && inputLicense.value.length) {
    appElement.removeAttribute('style');
  }
};

btnJoin.onclick = async () => {
  // Default conference parameters
  // See: https://docs.dolby.io/communications-apis/docs/js-client-sdk-model-conferenceparameters
  let conferenceParams = {
    liveRecording: false,
    rtcpMode: "average", // worst, average, max
    ttl: 0,
    videoCodec: "H264", // H264, VP8
    dolbyVoice: true
  };

  // See: https://docs.dolby.io/communications-apis/docs/js-client-sdk-model-conferenceoptions
  let conferenceOptions = {
    alias: inputConferenceAlias.value,
    params: conferenceParams
  };

  try {
    // Get a video track out of a canvas
    const track = canvasLocalVideo.captureStream(25).getVideoTracks()[0];

    // 1. Create a conference room with an alias
    const conference = await VoxeetSDK.conference.create(conferenceOptions);

    // See: https://docs.dolby.io/communications-apis/docs/js-client-sdk-model-joinoptions
    const joinOptions = {
      constraints: {
        audio: true,
        video: true
      },
      customVideoTrack: track
    };

    // 2. Join the conference
    await VoxeetSDK.conference.join(conference, joinOptions);

    inputConferenceAlias.disabled = true;
    btnJoin.disabled = true;
    btnLeave.disabled = false;
    btnStartVideo.disabled = true;
    btnStopVideo.disabled = false;
    btnChangeEffect.disabled = false;
  } catch (error) {
    console.error(error);
  }
};

btnLeave.onclick = async () => {
  try {
    // Leave the conference
    await VoxeetSDK.conference.leave();

    inputConferenceAlias.disabled = false;
    btnJoin.disabled = false;
    btnLeave.disabled = true;
    btnStartVideo.disabled = true;
    btnStopVideo.disabled = true;
    btnChangeEffect.disabled = true;
  } catch (error) {
    console.error(error);
  }
};

btnChangeEffect.onclick = () => {
  // Pick the next effect in the list
  currentEffectIdx = (currentEffectIdx + 1) % effects.length;
  const effect = effects[currentEffectIdx];
  deepAR.switchEffect(0, 'slot', effect);
};

btnStartVideo.onclick = async () => {
  try {
    // Get a video track out of a canvas at 25 frames per second
    const track = canvasLocalVideo.captureStream(25).getVideoTracks()[0];

    // Start sharing the video with the other participants
    await VoxeetSDK.video.local.start(track);

    btnStartVideo.disabled = true;
    btnStopVideo.disabled = false;
    btnChangeEffect.disabled = false;
  } catch (error) {
    console.error(error)
  }
};

btnStopVideo.onclick = async () => {
  try {
    // Stop sharing the video with the other participants
    await VoxeetSDK.video.local.stop();

    btnStopVideo.disabled = true;
    btnStartVideo.disabled = false;
    btnChangeEffect.disabled = true;
  } catch (error) {
    console.error(error)
  }
};

// Add a video stream to the web page
const addVideoNode = (participant, stream) => {
  let videoNode = document.getElementById('video-' + participant.id);

  if (!videoNode) {
    videoNode = document.createElement('video');

    videoNode.setAttribute('id', 'video-' + participant.id);
    videoNode.setAttribute('height', 240);
    videoNode.setAttribute('width', 320);
    videoNode.setAttribute("playsinline", true);
    videoNode.muted = true;
    videoNode.setAttribute("autoplay", 'autoplay');
    videoNode.style = 'background: gray;';

    const videoContainer = document.getElementById('video-container');
    videoContainer.appendChild(videoNode);
  }

  navigator.attachMediaStream(videoNode, stream);
};

// Remove the video stream from the web page
const removeVideoNode = (participant) => {
  let videoNode = document.getElementById('video-' + participant.id);

  if (videoNode) {
    videoNode.srcObject = null; // Prevent memory leak in Chrome
    videoNode.parentNode.removeChild(videoNode);
  }
};

// Add a new participant to the list
const addParticipantNode = (participant) => {
  // If the participant is the current session user, don't add them to the list
  if (participant.id === VoxeetSDK.session.participant.id) return;

  let participantNode = document.createElement('li');
  participantNode.setAttribute('id', 'participant-' + participant.id);
  participantNode.innerText = `${participant.info.name}`;

  const participantsList = document.getElementById('participants-list');
  participantsList.appendChild(participantNode);
};

// Remove a participant from the list
const removeParticipantNode = (participant) => {
  let participantNode = document.getElementById('participant-' + participant.id);

  if (participantNode) {
    participantNode.parentNode.removeChild(participantNode);
  }
};

// When a stream is added to the conference
VoxeetSDK.conference.on('streamAdded', (participant, stream) => {
  if (stream.type === 'ScreenShare') return;

  if (stream.getVideoTracks().length) {
    // Only add the video node if there is a video track
    addVideoNode(participant, stream);
  }

  addParticipantNode(participant);
});

// When a stream is updated
VoxeetSDK.conference.on('streamUpdated', (participant, stream) => {
  if (stream.type === 'ScreenShare') return;

  if (stream.getVideoTracks().length) {
    // Only add the video node if there is a video track
    addVideoNode(participant, stream);
  } else {
    removeVideoNode(participant);
  }
});

// When a stream is removed from the conference
VoxeetSDK.conference.on('streamRemoved', (participant, stream) => {
  if (stream.type === 'ScreenShare') return;

  removeVideoNode(participant);
  removeParticipantNode(participant);
});

// Load the license key and access from the URL is available
const queryParams = new URLSearchParams(window.location.search);
inputLicense.value = queryParams.get('license') || DEEP_AR_LICENSE_KEY;
inputAccessToken.value = queryParams.get('token') || ACCESS_TOKEN;

if (inputLicense.value && inputLicense.value.length) {
  // The DeepAR license is available
  btnInitDeepAr.click();
}

if (inputAccessToken.value && inputAccessToken.value.length) {
  // The Dolby.io access token is available
  btnInitDolbyIo.click();
}
