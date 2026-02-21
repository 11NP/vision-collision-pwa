console.log("THIS IS NEW VERSION");

const startBtn = document.getElementById("startBtn");
const switchBtn = document.getElementById("switchBtn");
const stopBtn = document.getElementById("stopBtn");
const video = document.getElementById("video");

let model;
let stream = null;
let currentFacingMode = "environment"; // start with back camera
let detecting = false;

async function loadModel() {
  model = await cocoSsd.load();
  console.log("MODEL LOADED");
}

async function startCamera() {
  if (stream) {
    stopCamera();
  }

  stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: currentFacingMode }
  });

  video.srcObject = stream;
  await video.play();
  console.log("VIDEO READY STATE:", video.readyState);
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
  await startCamera();

  detecting = true;
  detectFrame();
});

switchBtn.addEventListener("click", async () => {

  console.log("SWITCH CAMERA");

  currentFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";

  await startCamera();
});

stopBtn.addEventListener("click", () => {

  console.log("STOP CLICKED");

  stopCamera();
});

let lastDetectionTime = 0;
const detectionInterval = 200; // milliseconds (5 FPS)

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