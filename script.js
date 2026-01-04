const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const colors = ["#ff00ff", "#00ffff", "#00ff00", "#ffff00", "#ff0000"];
let currentColor = colors[0];
let lastPoint = null;

// Resize canvas exactly to video size
function resizeCanvas() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
}
video.addEventListener("loadeddata", resizeCanvas);
window.addEventListener("resize", () => {
  if (video.videoWidth) resizeCanvas();
});

// Helper distance
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// MediaPipe Hands
const hands = new Hands({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
});
hands.setOptions({
  maxNumHands: 1,
  modelComplexity: 1,
  minDetectionConfidence: 0.7,
  minTrackingConfidence: 0.7,
});

hands.onResults((results) => {
  if (!results.multiHandLandmarks || !results.multiHandLandmarks.length) {
    lastPoint = null;
    return;
  }

  const landmarks = results.multiHandLandmarks[0];
  const indexTip = landmarks[8];  // index finger tip
  const middleTip = landmarks[12]; // middle finger tip

  // Map to canvas coordinates
  const x = (1 - indexTip.x) * canvas.width; // mirror for natural drawing
  const y = indexTip.y * canvas.height;

  const indexPos = { x, y };
  const middlePos = { x: (1 - middleTip.x) * canvas.width, y: middleTip.y * canvas.height };

  // Change color gesture: two fingers apart
  if (distance(indexPos, middlePos) > 0.15 * canvas.width) {
    currentColor = colors[Math.floor(Math.random() * colors.length)];
  }

  // Draw line
  if (!lastPoint) lastPoint = indexPos;

  ctx.strokeStyle = currentColor;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(lastPoint.x, lastPoint.y);
  ctx.lineTo(indexPos.x, indexPos.y);
  ctx.stroke();

  lastPoint = indexPos;
});

// Start camera
const camera = new Camera(video, {
  onFrame: async () => {
    if (video.readyState >= 2) await hands.send({ image: video });
  },
  width: 1280,
  height: 720,
});
camera.start();
