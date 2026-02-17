console.log("THIS IS NEW VERSION");

const startBtn = document.getElementById("startBtn");
const video = document.getElementById("video");

let model;
let warningAudio = new Audio("warning.mp3");

async function loadModel() {
  model = await cocoSsd.load();
}

startBtn.addEventListener("click", async () => {

  startBtn.style.display = "none";

  await loadModel();

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  video.srcObject = stream;

  video.addEventListener("loadeddata", () => {
    detectFrame();
  });
});

async function detectFrame() {
  const predictions = await model.detect(video);

  predictions.forEach(prediction => {

    if (
      prediction.class === "person" ||
      prediction.class === "car" ||
      prediction.class === "truck" ||
      prediction.class === "bus" ||
      prediction.class === "motorcycle"
    ) {

      const height = prediction.bbox[3];

      if (height > 200) {
        warningAudio.play();
      }
    }
  });

  requestAnimationFrame(detectFrame);
}
startBtn.addEventListener("click", async () => {

  console.log("Start clicked");

  startBtn.style.display = "none";

  console.log("Loading model...");
  await loadModel();
  console.log("Model loaded");

  console.log("Requesting camera...");

  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" }
  });

  console.log("Camera granted");

  video.srcObject = stream;

  video.addEventListener("loadeddata", () => {
    console.log("Video loaded");
    detectFrame();
  });
});

