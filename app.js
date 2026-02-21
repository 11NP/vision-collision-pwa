console.log("FORWARD COLLISION SYSTEM INITIALIZED");

const startBtn = document.getElementById("startBtn");
const switchBtn = document.getElementById("switchBtn");
const stopBtn = document.getElementById("stopBtn");
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");



let model;
let stream = null;
let detecting = false;

let cameras = [];
let currentCameraIndex = 0;

const objectHistory = {};
// 🔊 Collision Audio System
const warningAudio = new Audio("warning.mp3");
warningAudio.loop = true;

let collisionStartTime = null;
let alarmPlaying = false;

const collisionConfirmTime = 100; // milliseconds

async function loadModel() {
  model = await cocoSsd.load();
  console.log("MODEL LOADED");
}

async function getCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  cameras = devices.filter(d => d.kind === "videoinput");
}

async function startCamera() {

  if (stream) stopCamera();

  if (cameras.length === 0) {
    await getCameras();
  }

  const selectedDeviceId = cameras[currentCameraIndex]?.deviceId;

  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      deviceId: selectedDeviceId ? { ideal: selectedDeviceId } : undefined,
      aspectRatio: { ideal: 1.777 },
      width: { ideal: 1280 },
      height: { ideal: 720 }
    }
  });

  video.srcObject = stream;
  await video.play();
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  detecting = false;
}

startBtn.addEventListener("click", async () => {

  await loadModel();
  await getCameras();
  await startCamera();

  // Fullscreen
  if (document.documentElement.requestFullscreen) {
    await document.documentElement.requestFullscreen();
  }

  // Lock Landscape
  if (screen.orientation && screen.orientation.lock) {
    try {
      await screen.orientation.lock("landscape");
    } catch (e) {
      console.log("Orientation lock failed");
    }
  }

  detecting = true;
  detectFrame();
});

switchBtn.addEventListener("click", async () => {

  if (cameras.length < 2) return;

  currentCameraIndex =
    (currentCameraIndex + 1) % cameras.length;

  await startCamera();
});

stopBtn.addEventListener("click", () => {
  stopCamera();
});

function isInsideDrivingPath(x, y, width, height) {

  const centerX = x + width / 2;
  const bottomY = y + height;

  const screenWidth = canvas.width;
  const screenHeight = canvas.height;

  const bottomLeft = screenWidth * 0.2;
  const bottomRight = screenWidth * 0.8;

  const topLeft = screenWidth * 0.45;
  const topRight = screenWidth * 0.55;

  const pathTopY = screenHeight * 0.4;

  if (bottomY < pathTopY) return false;

  const progress =
    (bottomY - pathTopY) /
    (screenHeight - pathTopY);

  const dynamicLeft =
    topLeft + (bottomLeft - topLeft) * progress;

  const dynamicRight =
    topRight + (bottomRight - topRight) * progress;

  return centerX > dynamicLeft &&
         centerX < dynamicRight;
}

async function detectFrame() {

  if (!detecting) return;

  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 🔷 Draw Driving Path Trapezoid

const screenWidth = canvas.width;
const screenHeight = canvas.height;

const bottomLeft = screenWidth * 0.2;
const bottomRight = screenWidth * 0.8;

const topLeft = screenWidth * 0.45;
const topRight = screenWidth * 0.55;

const pathTopY = screenHeight * 0.4;

// Optional transparent fill
ctx.beginPath();
ctx.moveTo(bottomLeft, screenHeight);
ctx.lineTo(bottomRight, screenHeight);
ctx.lineTo(topRight, pathTopY);
ctx.lineTo(topLeft, pathTopY);
ctx.closePath();

ctx.fillStyle = "rgba(0, 255, 0, 0.08)";
ctx.fill();

ctx.strokeStyle = "lime";
ctx.lineWidth = 2;
ctx.stroke();

  const predictions = await model.detect(video);

  let collisionDetectedThisFrame = false;

 predictions.forEach(prediction => {

  if (prediction.score < 0.6) return;

  const className = prediction.class;

  // Allowed relevant road objects
  if (
    className !== "person" &&
    className !== "car" &&
    className !== "truck" &&
    className !== "bus" &&
    className !== "motorcycle" &&
    className !== "bicycle" &&
    className !== "dog" &&
    className !== "bench" &&
    className !== "fire hydrant" &&
    className !== "tree"
  ) return;

  const [x, y, width, height] = prediction.bbox;

  let boxColor = "green";
  let riskText = "SAFE";

  const insidePath =
    isInsideDrivingPath(x, y, width, height);

  const objectId =
    `${className}-${Math.round(x/20)}-${Math.round(y/20)}`;

  if (insidePath) {

    const now = Date.now();

    if (!objectHistory[objectId]) {
      objectHistory[objectId] = {
        lastHeight: height,
        lastTime: now
      };
    } else {

      const previous = objectHistory[objectId];

      const deltaHeight =
        height - previous.lastHeight;

      const deltaTime =
        (now - previous.lastTime) / 1000;

      const relativeSpeed =
        deltaHeight / deltaTime;

      const ttc =
        relativeSpeed > 0
          ? height / relativeSpeed
          : Infinity;

      if (ttc < 1.2) {
        boxColor = "red";
        riskText = "HIGH COLLISION";
        collisionDetectedThisFrame = true;
      }
      else if (ttc < 2.5) {
        boxColor = "orange";
        riskText = "WARNING";
      }

      objectHistory[objectId] = {
        lastHeight: height,
        lastTime: now
      };
    }

  }

  ctx.strokeStyle = boxColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);

  ctx.fillStyle = boxColor;
  ctx.font = "16px Arial";
  const label = `${className} - ${riskText}`;
  const textWidth = ctx.measureText(label).width;

  ctx.fillRect(x, y - 25, textWidth + 10, 25);

  ctx.fillStyle = "black";
  ctx.fillText(label, x + 5, y - 7);

});

  // 🔊 Stable Audio Trigger Logic
  if (collisionDetectedThisFrame) {

    if (!collisionStartTime) {
      collisionStartTime = Date.now();
    }

    const duration = Date.now() - collisionStartTime;

    if (duration > collisionConfirmTime && !alarmPlaying) {
      warningAudio.play();
      alarmPlaying = true;
    }

  } else {

    collisionStartTime = null;

    if (alarmPlaying) {
      warningAudio.pause();
      warningAudio.currentTime = 0;
      alarmPlaying = false;
    }
  }

  requestAnimationFrame(detectFrame);
}