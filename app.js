console.log("THIS IS NEW VERSION");

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

  const ctx = canvas.getContext("2d");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const predictions = await model.detect(video);

  let counters = {};

  predictions.forEach(prediction => {

    const className = prediction.class;

    if (
      className !== "person" &&
      className !== "car" &&
      className !== "truck" &&
      className !== "bus" &&
      className !== "motorcycle"
    ) return;

    if (!counters[className]) {
      counters[className] = 1;
    } else {
      counters[className]++;
    }

    const labelIndex = counters[className];

    const [x, y, width, height] = prediction.bbox;

    let boxColor = "green";
    let riskText = "SAFE";

    if (height > 200) {
      boxColor = "red";
      riskText = "80% COLLISION";
    } 
    else if (height > 120) {
      boxColor = "orange";
      riskText = "WARNING";
    }

    const label = `${className}${labelIndex} - ${riskText}`;

    ctx.strokeStyle = boxColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, width, height);

    ctx.fillStyle = boxColor;
    ctx.fillRect(x, y - 30, ctx.measureText(label).width + 10, 28);

    ctx.fillStyle = "black";
    ctx.font = "16px Arial";
    ctx.fillText(label, x + 5, y - 10);

  });

  requestAnimationFrame(detectFrame);
}

 
