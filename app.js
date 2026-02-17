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

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }
    });

    video.srcObject = stream;
    await video.play();

    video.addEventListener("loadeddata", () => {
      detectFrame();
    });

  } catch (error) {
    console.error("Camera error:", error);
    alert("Camera access failed. Check browser permissions.");
  }
});

async function detectFrame() {

  const predictions = await model.detect(video);

  console.log("Predictions:", predictions);

  requestAnimationFrame(detectFrame);
}


let lastAlertTime = 0;

function triggerWarning() {
  const now = Date.now();

  // Prevent audio spam
  if (now - lastAlertTime > 2000) {
    warningAudio.play();
    lastAlertTime = now;
  }
}
