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

aasync function detectFrame() {

  const predictions = await model.detect(video);

  predictions.forEach(prediction => {

    // Debug (temporary)
    console.log(prediction.class, prediction.score);

    if (
      (prediction.class === "person" ||
       prediction.class === "car" ||
       prediction.class === "truck" ||
       prediction.class === "bus" ||
       prediction.class === "motorcycle") 
      &&
      prediction.score > 0.5   // confidence filter
    ) {

      const height = prediction.bbox[3];

      if (height > 80) {   // reduced threshold for mobile
        triggerWarning();
      }
    }
  });

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
