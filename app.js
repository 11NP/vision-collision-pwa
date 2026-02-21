console.log("THIS IS NEW VERSION");

const startBtn = document.getElementById("startBtn");
const switchBtn = document.getElementById("switchBtn");
const stopBtn = document.getElementById("stopBtn");
const video = document.getElementById("video");

let model;
let stream = null;
let detecting = false;

let cameras = [];
let currentCameraIndex = 0;

async function loadModel() {
  model = await cocoSsd.load();
  console.log("MODEL LOADED");
}

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  cameras = devices.filter(device => device.kind === "videoinput");
  console.log("Available Cameras:", cameras);
}

async function startCamera() {

  if (stream) {
    stopCamera();
  }

  if (cameras.length === 0) {
    await getCameras();
  }

  const deviceId = cameras[currentCameraIndex].deviceId;

  stream = await navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: deviceId } }
  });

  video.srcObject = stream;
  await video.play();

  console.log("Using camera index:", currentCameraIndex);
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  detecting = false;
  console.log("CAMERA STOPPED");
}

startBtn.addEventListener("click", async () => {

  console.log("START CLICKED");

  await loadModel();
  await getCameras();
  await startCamera();

  detecting = true;
  detectFrame();
});

switchBtn.addEventListener("click", async () => {

  if (cameras.length < 2) {
    alert("Only one camera available");
    return;
  }

  currentCameraIndex =
    (currentCameraIndex + 1) % cameras.length;

  await startCamera();
});

stopBtn.addEventListener("click", () => {
  stopCamera();
});

let lastDetectionTime = 0;
const detectionInterval = 200;

async function detectFrame() {

  if (!detecting) return;

  const now = Date.now();

  if (now - lastDetectionTime > detectionInterval) {

    const predictions = await model.detect(video);
    console.log("Predictions:", predictions);

    lastDetectionTime = now;
  }

  requestAnimationFrame(detectFrame);
}