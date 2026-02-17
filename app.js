console.log("THIS IS NEW VERSION");

const startBtn = document.getElementById("startBtn");
const video = document.getElementById("video");

let model;

async function loadModel() {
  model = await cocoSsd.load();
  console.log("MODEL LOADED");
}

startBtn.addEventListener("click", async () => {

  console.log("BUTTON CLICKED");

  startBtn.style.display = "none";

  await loadModel();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true
    });

    video.srcObject = stream;
    await video.play();

    console.log("VIDEO READY STATE:", video.readyState);

    detectFrame();

  } catch (error) {
    console.error("Camera error:", error);
  }
});

async function detectFrame() {

  const predictions = await model.detect(video);

  console.log("Predictions:", predictions);

  requestAnimationFrame(detectFrame);
}
