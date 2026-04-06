const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');

const toggleAudioButton = document.getElementById('toggleAudio');
const speedSlider = document.getElementById('speed');
const toneSlider = document.getElementById('tone');
const SPEED_MULTIPLIER = 2;

const state = {
  x: 0,
  y: 0,
  radius: 24,
  velocityX: Number(speedSlider.value) * SPEED_MULTIPLIER,
  minX: 0,
  maxX: 0,
  audioStarted: false,
  audioContext: null,
  leftOsc: null,
  rightOsc: null,
  leftGain: null,
  rightGain: null
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function updateMotionBounds() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  state.minX = state.radius + 12;
  state.maxX = canvas.width - state.radius - 12;
  state.y = canvas.height / 2;

  if (state.x === 0) {
    state.x = canvas.width / 2;
  }

  state.x = clamp(state.x, state.minX, state.maxX);
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
  gradient.addColorStop(0, '#1f2f59');
  gradient.addColorStop(0.5, '#152445');
  gradient.addColorStop(1, '#1f2f59');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = 'rgba(169, 204, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(state.minX, state.y);
  ctx.lineTo(state.maxX, state.y);
  ctx.stroke();
}

function drawCircle() {
  ctx.beginPath();
  ctx.arc(state.x, state.y, state.radius, 0, Math.PI * 2);

  const glow = ctx.createRadialGradient(state.x - 6, state.y - 6, 2, state.x, state.y, 28);
  glow.addColorStop(0, '#f1f9ff');
  glow.addColorStop(0.45, '#9ad8ff');
  glow.addColorStop(1, '#52b9ea');

  ctx.fillStyle = glow;
  ctx.fill();
}

function updateAudioPosition() {
  if (!state.audioStarted) {
    return;
  }

  if (state.maxX <= state.minX) {
    return;
  }

  const normalized = clamp((state.x - state.minX) / (state.maxX - state.minX), 0, 1);
  const leftLevel = clamp(1 - normalized, 0.04, 1);
  const rightLevel = clamp(normalized, 0.04, 1);

  const now = state.audioContext.currentTime;
  state.leftGain.gain.setTargetAtTime(leftLevel * 0.09, now, 0.02);
  state.rightGain.gain.setTargetAtTime(rightLevel * 0.09, now, 0.02);
}

function animate() {
  state.x += state.velocityX;

  if (state.x >= state.maxX || state.x <= state.minX) {
    state.velocityX *= -1;
    state.x = clamp(state.x, state.minX, state.maxX);
  }

  drawBackground();
  drawCircle();
  updateAudioPosition();
  requestAnimationFrame(animate);
}

function createAudioGraph() {
  const ACtor = window.AudioContext || window.webkitAudioContext;
  const audioContext = new ACtor();

  const leftOsc = audioContext.createOscillator();
  leftOsc.type = 'triangle';
  leftOsc.frequency.value = Number(toneSlider.value);

  const rightOsc = audioContext.createOscillator();
  rightOsc.type = 'triangle';
  rightOsc.frequency.value = Number(toneSlider.value) + 18;

  const leftGain = audioContext.createGain();
  leftGain.gain.value = 0;

  const rightGain = audioContext.createGain();
  rightGain.gain.value = 0;

  const leftPan = audioContext.createStereoPanner();
  leftPan.pan.value = -0.9;

  const rightPan = audioContext.createStereoPanner();
  rightPan.pan.value = 0.9;

  leftOsc.connect(leftGain).connect(leftPan).connect(audioContext.destination);
  rightOsc.connect(rightGain).connect(rightPan).connect(audioContext.destination);

  leftOsc.start();
  rightOsc.start();

  state.audioContext = audioContext;
  state.leftOsc = leftOsc;
  state.rightOsc = rightOsc;
  state.leftGain = leftGain;
  state.rightGain = rightGain;
  state.audioStarted = true;

  updateAudioPosition();
}

toggleAudioButton.addEventListener('click', async () => {
  if (!state.audioStarted) {
    createAudioGraph();
    toggleAudioButton.textContent = 'Audio Running';
    toggleAudioButton.disabled = true;
  }
});

speedSlider.addEventListener('input', (event) => {
  const sign = Math.sign(state.velocityX) || 1;
  state.velocityX = Number(event.target.value) * SPEED_MULTIPLIER * sign;
});

toneSlider.addEventListener('input', (event) => {
  const base = Number(event.target.value);
  if (!state.audioStarted) {
    return;
  }

  const now = state.audioContext.currentTime;
  state.leftOsc.frequency.setTargetAtTime(base, now, 0.03);
  state.rightOsc.frequency.setTargetAtTime(base + 18, now, 0.03);
});

window.addEventListener('resize', updateMotionBounds);

updateMotionBounds();
drawBackground();
drawCircle();
requestAnimationFrame(animate);