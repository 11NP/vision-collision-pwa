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
    await video.play();


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
