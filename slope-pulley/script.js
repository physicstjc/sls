const canvas = document.getElementById("simCanvas");
const ctx = canvas.getContext("2d");

const ui = {
  slopeMass: document.getElementById("slopeMass"),
  hangingMass: document.getElementById("hangingMass"),
  pulleyCorner: document.getElementById("pulleyCorner"),
  calcToggle: document.getElementById("calcToggle"),
  calcBox: document.getElementById("calcBox"),
  weightHangingValue: document.getElementById("weightHangingValue"),
  slopeParallelValue: document.getElementById("slopeParallelValue"),
  playBtn: document.getElementById("playBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  resetBtn: document.getElementById("resetBtn"),
  status: document.getElementById("status")
};

const state = {
  running: false,
  lastTime: 0,
  gravity: 9.81,
  motionElapsed: 0,
  motionSign: 1,
  motionAccel: 0,
  slopePos0: 0,
  slopeVel0: 0,
  hangingPos0: 0,
  hangingVel0: 0,
  dragMode: null,
  activePointerId: null,
  slope: {
    mass: 3,
    pos: 0,
    vel: 0,
    initialPos: 0
  },
  hanging: {
    mass: 2,
    pos: 110,
    vel: 0,
    initialPos: 110
  },
  pulley: {
    radius: 25,
    spin: 0
  }
};

const world = {
  margin: 42,
  blockSize: 40,
  slopeStrokeWidth: 10,
  hangMin: 30,
  hangMax: 250,
  slopeYCenter: 265,
  defaultSlopeWidthRatio: 0.6,
  minSlopeWidthRatio: 0.4,
  maxSlopeWidthRatio: 0.8,
  slopeLength: 0,
  maxAngleDeg: 90,
  leftPoint: { x: 0, y: 0 },
  rightPoint: { x: 0, y: 0 },
  slopeUnit: { x: 1, y: 0 },
  slopeNormal: { x: 0, y: -1 },
  slopeTy: 0,
  angleDisplay: 0
};

function setStatus(text) {
  if (ui.status) {
    ui.status.textContent = text;
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function roundToHalfDeg(value) {
  return Math.round(value * 2) / 2;
}

function allowedSpanLimits() {
  return {
    minSpan: canvas.width * world.minSlopeWidthRatio,
    maxSpan: canvas.width * world.maxSlopeWidthRatio
  };
}

function currentPulleyCorner() {
  return ui.pulleyCorner?.value === "left" ? "left" : "right";
}

function syncMassInputs() {
  const slopeMassValue = Number(ui.slopeMass?.value);
  const hangingMassValue = Number(ui.hangingMass?.value);

  state.slope.mass = clamp(Number.isFinite(slopeMassValue) && slopeMassValue > 0 ? slopeMassValue : state.slope.mass, 1, 500);
  state.hanging.mass = clamp(Number.isFinite(hangingMassValue) && hangingMassValue > 0 ? hangingMassValue : state.hanging.mass, 1, 500);
  updateCalculations();
  updateAcceleration();
}

function updateAcceleration() {
  const { slopeTowardPulleySign, accel } = currentSystemAcceleration();
  state.motionAccel = accel;
  state.motionSign = slopeTowardPulleySign;
  
  // Update initial conditions for the current pose
  state.slopePos0 = state.slope.pos;
  state.hangingPos0 = state.hanging.pos;
  state.slopeVel0 = state.slope.vel;
  state.hangingVel0 = state.hanging.vel;
  state.motionElapsed = 0;
}

function updateCalculations() {
  const hangingWeight = state.hanging.mass * state.gravity;
  const slopeParallel = state.slope.mass * state.gravity * Math.abs(world.slopeTy);

  if (ui.weightHangingValue) {
    ui.weightHangingValue.textContent = `${hangingWeight.toFixed(2)} N`;
  }
  if (ui.slopeParallelValue) {
    ui.slopeParallelValue.textContent = `${slopeParallel.toFixed(2)} N`;
  }
}

function toggleCalculations() {
  if (!ui.calcBox || !ui.calcToggle) {
    return;
  }

  const expanded = ui.calcToggle.checked;
  ui.calcBox.classList.toggle("hidden", !expanded);
  ui.calcToggle.setAttribute("aria-expanded", expanded ? "true" : "false");
}

function getPulleyPoint() {
  return currentPulleyCorner() === "left" ? world.leftPoint : world.rightPoint;
}

function updateSlopeVectors() {
  const vx = world.rightPoint.x - world.leftPoint.x;
  const vy = world.rightPoint.y - world.leftPoint.y;
  world.slopeLength = Math.hypot(vx, vy);
  world.slopeUnit.x = vx / world.slopeLength;
  world.slopeUnit.y = vy / world.slopeLength;
  world.slopeNormal.x = world.slopeUnit.y;
  world.slopeNormal.y = -world.slopeUnit.x;
  world.slopeTy = world.slopeUnit.y;
  world.angleDisplay = roundToHalfDeg(Math.abs((Math.atan2(vy, vx) * 180) / Math.PI));
  updateCalculations();
  updateAcceleration();

  const minSlope = world.blockSize * 0.7;
  const maxSlope = world.slopeLength - world.blockSize * 0.7;
  state.slope.pos = clamp(state.slope.pos, minSlope, maxSlope);
}

function resetSlopeGeometry() {
  const slopeWidth = canvas.width * world.defaultSlopeWidthRatio;
  const leftX = (canvas.width - slopeWidth) / 2;

  world.leftPoint.x = leftX;
  world.rightPoint.x = leftX + slopeWidth;
  world.leftPoint.y = world.slopeYCenter;
  world.rightPoint.y = world.slopeYCenter;
  updateSlopeVectors();
}

function clampCornerByAngle(cornerY, otherY, dx) {
  const maxDy = world.maxAngleDeg >= 89.9
    ? Number.POSITIVE_INFINITY
    : Math.tan((world.maxAngleDeg * Math.PI) / 180) * dx;
  return clamp(cornerY, otherY - maxDy, otherY + maxDy);
}

function moveCornerToPointer(corner, pointerX, pointerY) {
  const minY = 50;
  const maxY = canvas.height - 50;
  const { minSpan, maxSpan } = allowedSpanLimits();

  if (corner === "left") {
    let nextX = clamp(pointerX, world.margin, world.rightPoint.x - minSpan);
    nextX = Math.max(nextX, world.rightPoint.x - maxSpan);

    const dx = Math.max(10, world.rightPoint.x - nextX);
    let nextY = clamp(pointerY, minY, maxY);
    nextY = clampCornerByAngle(nextY, world.rightPoint.y, dx);

    world.leftPoint.x = nextX;
    world.leftPoint.y = nextY;
  } else {
    let nextX = clamp(pointerX, world.leftPoint.x + minSpan, canvas.width - world.margin);
    nextX = Math.min(nextX, world.leftPoint.x + maxSpan);

    const dx = Math.max(10, nextX - world.leftPoint.x);
    let nextY = clamp(pointerY, minY, maxY);
    nextY = clampCornerByAngle(nextY, world.leftPoint.y, dx);

    world.rightPoint.x = nextX;
    world.rightPoint.y = nextY;
  }

  updateSlopeVectors();
}

function moveCornerToY(corner, pointerY) {
  const minY = 50;
  const maxY = canvas.height - 50;
  const clampedY = clamp(pointerY, minY, maxY);

  const dx = world.rightPoint.x - world.leftPoint.x;
  const maxDy = world.maxAngleDeg >= 89.9
    ? Number.POSITIVE_INFINITY
    : Math.tan((world.maxAngleDeg * Math.PI) / 180) * dx;

  if (corner === "left") {
    const minLeft = world.rightPoint.y - maxDy;
    const maxLeft = world.rightPoint.y + maxDy;
    world.leftPoint.y = clamp(clampedY, minLeft, maxLeft);
  } else {
    const minRight = world.leftPoint.y - maxDy;
    const maxRight = world.leftPoint.y + maxDy;
    world.rightPoint.y = clamp(clampedY, minRight, maxRight);
  }

  updateSlopeVectors();
}

function dragPulleyToY(pointerY) {
  moveCornerToY(currentPulleyCorner(), pointerY);
}

function getSlopePoint(posAlongSlope) {
  return {
    x: world.leftPoint.x + world.slopeUnit.x * posAlongSlope,
    y: world.leftPoint.y + world.slopeUnit.y * posAlongSlope
  };
}

function getSlopeBlockCenter() {
  const p = getSlopePoint(state.slope.pos);
  const contactOffset = world.blockSize / 2 + world.slopeStrokeWidth / 2;
  return {
    x: p.x + world.slopeNormal.x * contactOffset,
    y: p.y + world.slopeNormal.y * contactOffset
  };
}

function getHangingDirection() {
  return currentPulleyCorner() === "left" ? -1 : 1;
}

function getHangingBlockCenter() {
  const pulley = getPulleyPoint();
  const side = getHangingDirection();
  return {
    x: pulley.x + side * state.pulley.radius,
    y: pulley.y + state.hanging.pos
  };
}

function getCanvasPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function pointerNearPulley(pointer) {
  const pulley = getPulleyPoint();
  const dx = pointer.x - pulley.x;
  const dy = pointer.y - pulley.y;
  return Math.hypot(dx, dy) <= 28;
}

function pointerNearCorner(pointer, corner) {
  const point = corner === "left" ? world.leftPoint : world.rightPoint;
  const dx = pointer.x - point.x;
  const dy = pointer.y - point.y;
  return Math.hypot(dx, dy) <= 20;
}

function onCanvasPointerDown(event) {
  const pointer = getCanvasPointer(event);
  if (pointerNearCorner(pointer, "left")) {
    state.dragMode = "left-corner";
  } else if (pointerNearCorner(pointer, "right")) {
    state.dragMode = "right-corner";
  } else if (pointerNearPulley(pointer)) {
    state.dragMode = "pulley";
  } else {
    return;
  }

  state.activePointerId = event.pointerId;
  canvas.setPointerCapture(event.pointerId);
  if (state.dragMode === "left-corner") {
    moveCornerToPointer("left", pointer.x, pointer.y);
  } else if (state.dragMode === "right-corner") {
    moveCornerToPointer("right", pointer.x, pointer.y);
  } else {
    dragPulleyToY(pointer.y);
  }
}

function onCanvasPointerMove(event) {
  if (!state.dragMode || event.pointerId !== state.activePointerId) {
    return;
  }
  const pointer = getCanvasPointer(event);
  if (state.dragMode === "left-corner") {
    moveCornerToPointer("left", pointer.x, pointer.y);
  } else if (state.dragMode === "right-corner") {
    moveCornerToPointer("right", pointer.x, pointer.y);
  } else {
    dragPulleyToY(pointer.y);
  }
}

function onCanvasPointerUp(event) {
  if (!state.dragMode || event.pointerId !== state.activePointerId) {
    return;
  }
  const draggedCorner = state.dragMode;
  state.dragMode = null;
  state.activePointerId = null;
  canvas.releasePointerCapture(event.pointerId);
  if (draggedCorner === "pulley") {
    setStatus(`Slope set to ${world.angleDisplay.toFixed(1)}° by dragging pulley.`);
  } else {
    const cornerText = draggedCorner === "left-corner" ? "left" : "right";
    setStatus(`Slope updated by dragging ${cornerText} corner.`);
  }
}

function resolveSlopeBounds() {
  return [world.blockSize * 0.7, world.slopeLength - world.blockSize * 0.7];
}

function currentSystemAcceleration() {
  const slopeTowardPulleySign = currentPulleyCorner() === "right" ? 1 : -1;
  const slopeGravityTowardPulley = slopeTowardPulleySign * state.slope.mass * state.gravity * world.slopeTy;
  const accel = (state.hanging.mass * state.gravity + slopeGravityTowardPulley) / (state.slope.mass + state.hanging.mass);
  return { slopeTowardPulleySign, accel };
}

function enforceConstraintBounds() {
  const [minSlope, maxSlope] = resolveSlopeBounds();
  const minHang = world.hangMin;
  const maxHang = world.hangMax;

  let hit = false;
  if (state.slope.pos < minSlope) {
    state.slope.pos = minSlope;
    hit = true;
  }
  if (state.slope.pos > maxSlope) {
    state.slope.pos = maxSlope;
    hit = true;
  }
  if (state.hanging.pos < minHang) {
    state.hanging.pos = minHang;
    hit = true;
  }
  if (state.hanging.pos > maxHang) {
    state.hanging.pos = maxHang;
    hit = true;
  }

  if (hit) {
    state.slope.vel = 0;
    state.hanging.vel = 0;
  }

  return hit;
}

function simulate(dt) {
  state.motionElapsed += dt;
  const t = state.motionElapsed;

  state.hanging.pos = state.hangingPos0 + state.hangingVel0 * t + 0.5 * state.motionAccel * t * t;
  state.slope.pos = state.slopePos0 + state.slopeVel0 * t + 0.5 * state.motionSign * state.motionAccel * t * t;

  state.hanging.vel = state.hangingVel0 + state.motionAccel * t;
  state.slope.vel = state.motionSign * state.hanging.vel;

  const hitLimit = enforceConstraintBounds();
  if (hitLimit) {
    state.running = false;
    setStatus("Motion stopped at travel limit.");
  }

  const cornerSpinSign = currentPulleyCorner() === "left" ? -1 : 1;
  state.pulley.spin += cornerSpinSign * (state.hanging.vel / state.pulley.radius) * dt;
}

function drawBackgroundGrid() {
  const spacing = 34;
  ctx.save();
  ctx.strokeStyle = "rgba(15, 110, 114, 0.12)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= canvas.width; x += spacing) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y <= canvas.height; y += spacing) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSlope() {
  ctx.save();
  ctx.lineWidth = world.slopeStrokeWidth;
  ctx.strokeStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.moveTo(world.leftPoint.x, world.leftPoint.y);
  ctx.lineTo(world.rightPoint.x, world.rightPoint.y);
  ctx.stroke();

  ctx.lineWidth = 6;
  ctx.strokeStyle = "#0f6e72";
  ctx.beginPath();
  ctx.moveTo(world.leftPoint.x, world.leftPoint.y);
  ctx.lineTo(world.rightPoint.x, world.rightPoint.y);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(world.leftPoint.x, world.leftPoint.y, 5, 0, Math.PI * 2);
  ctx.arc(world.rightPoint.x, world.rightPoint.y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "700 14px Space Grotesk";
  ctx.fillText(`Angle: ${world.angleDisplay.toFixed(1)}°`, 20, 28);
  ctx.restore();
}

function ropeContactGeometry() {
  const pulley = getPulleyPoint();
  const slopeCenter = getSlopeBlockCenter();
  const hangingCenter = getHangingBlockCenter();
  const side = getHangingDirection();
  const r = state.pulley.radius;
  const topTangent = {
    x: pulley.x,
    y: pulley.y - r
  };
  const hangTangent = {
    x: pulley.x + side * r,
    y: pulley.y
  };

  const slopeRopePoint = {
    x: slopeCenter.x,
    y: slopeCenter.y
  };

  const arcStart = -Math.PI / 2;
  const arcEnd = side === 1 ? 0 : Math.PI;
  const arcCCW = side === -1;

  return {
    slopeRopePoint,
    hangingCenter,
    topTangent,
    hangTangent,
    arcStart,
    arcEnd,
    arcCCW
  };
}

function drawPulley() {
  const pulley = getPulleyPoint();
  const r = state.pulley.radius;

  ctx.save();
  ctx.translate(pulley.x, pulley.y);

  ctx.fillStyle = "#ffe030";
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.rotate(state.pulley.spin);
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const ang = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 3, Math.sin(ang) * 3);
    ctx.lineTo(Math.cos(ang) * (r - 3), Math.sin(ang) * (r - 3));
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fillStyle = "#0a0a0a";
  ctx.fill();
  ctx.restore();
}

function drawRope() {
  const geom = ropeContactGeometry();
  if (!geom) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = "#222";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(geom.slopeRopePoint.x, geom.slopeRopePoint.y);
  ctx.lineTo(geom.topTangent.x, geom.topTangent.y);

  const pulley = getPulleyPoint();
  ctx.arc(
    pulley.x,
    pulley.y,
    state.pulley.radius,
    geom.arcStart,
    geom.arcEnd,
    geom.arcCCW
  );

  ctx.lineTo(geom.hangingCenter.x, geom.hangingCenter.y);
  ctx.stroke();

  ctx.restore();
}

function drawArrow(x, y, dx, dy, color, label) {
  if (Math.hypot(dx, dy) < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + dx, y + dy);
  ctx.stroke();

  const angle = Math.atan2(dy, dx);
  const headLen = 8;
  ctx.beginPath();
  ctx.moveTo(x + dx, y + dy);
  ctx.lineTo(x + dx - headLen * Math.cos(angle - Math.PI / 6), y + dy - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x + dx - headLen * Math.cos(angle + Math.PI / 6), y + dy - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  if (label) {
    ctx.font = "12px Space Grotesk";
    ctx.fillText(label, x + dx + 5, y + dy + 5);
  }
  ctx.restore();
}

function drawBlock(center, label, mass, color, angleRad = 0, isSlopeBlock = false) {
  const size = world.blockSize;

  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angleRad);

  ctx.fillStyle = color;
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = 2;

  ctx.fillRect(-size / 2, -size / 2, size, size);
  ctx.strokeRect(-size / 2, -size / 2, size, size);

  ctx.fillStyle = "#0a0a0a";
  ctx.font = "700 14px Space Grotesk";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, 0, -2);

  ctx.font = "600 10px Space Grotesk";
  ctx.fillText(`${mass.toFixed(1)}kg`, 0, 9);
  ctx.restore();

  if (isSlopeBlock && ui.calcToggle && ui.calcToggle.checked) {
    const scale = 2.5; 
    const maxVectorLen = 100;
    const W = clamp(mass * state.gravity * scale, 0, maxVectorLen);
    const theta = Math.atan2(world.slopeUnit.y, world.slopeUnit.x);
    
    // Weight (Vertical - always downwards)
    drawArrow(center.x, center.y, 0, W, "#e74c3c", "W");
    
    // Components (relative to slope)
    // We scale the components by the dampened Weight to keep them proportional
    const W_para = W * Math.sin(theta);
    const W_perp = W * Math.cos(theta);
    
    // Perpendicular component (down into slope - always in direction of slope normal)
    drawArrow(center.x, center.y, W_perp * world.slopeNormal.x, W_perp * world.slopeNormal.y, "#9b59b6", "W\u22A5");
    
    // Parallel component (along slope - parallel weight component always pulls "down" the slope)
    drawArrow(center.x, center.y, W_para * world.slopeUnit.x, W_para * world.slopeUnit.y, "#3498db", "W\u2225");
  } else if (!isSlopeBlock && ui.calcToggle && ui.calcToggle.checked) {
    // Hanging weight (Vertical - always downwards)
    const scale = 2.5;
    const maxVectorLen = 100;
    const W = clamp(mass * state.gravity * scale, 0, maxVectorLen);
    drawArrow(center.x, center.y, 0, W, "#e74c3c", "W");
  }
}

function drawBlocks() {
  const slopeCenter = getSlopeBlockCenter();
  const hangingCenter = getHangingBlockCenter();
  const slopeAngle = Math.atan2(world.slopeUnit.y, world.slopeUnit.x);

  drawBlock(slopeCenter, "A", state.slope.mass, "#8dd3c7", slopeAngle, true);
  drawBlock(hangingCenter, "B", state.hanging.mass, "#fb8072", 0, false);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackgroundGrid();
  drawSlope();
  drawRope();
  drawPulley();
  drawBlocks();
}

function resetSimulation() {
  state.running = false;
  state.motionElapsed = 0;
  state.motionSign = 1;
  state.motionAccel = 0;
  state.dragMode = null;
  state.activePointerId = null;
  state.lastTime = 0;

  syncMassInputs();
  resetSlopeGeometry();

  state.slope.pos = world.slopeLength * 0.5;
  state.slope.vel = 0;
  state.slope.initialPos = state.slope.pos;

  state.hanging.pos = state.hanging.initialPos;
  state.hanging.vel = 0;

  state.pulley.spin = 0;
  setStatus("Simulation reset. Slope returned to 0.0°.");
}

function onPulleyCornerChange() {
  resetSlopeGeometry();
  state.motionElapsed = 0;
  state.slope.vel = 0;
  state.hanging.vel = 0;
  setStatus(`Pulley moved to ${currentPulleyCorner()} corner.`);
}

function startAnimation() {
  syncMassInputs();
  const motion = currentSystemAcceleration();
  state.motionElapsed = 0;
  state.motionSign = motion.slopeTowardPulleySign;
  state.motionAccel = motion.accel;
  state.slopePos0 = state.slope.pos;
  state.slopeVel0 = state.slope.vel;
  state.hangingPos0 = state.hanging.pos;
  state.hangingVel0 = state.hanging.vel;
  state.running = true;
  setStatus("Animation running.");
}

function pauseAnimation() {
  state.running = false;
  setStatus("Paused.");
}

function loop(timestamp) {
  if (!state.lastTime) {
    state.lastTime = timestamp;
  }

  const dt = clamp((timestamp - state.lastTime) / 1000, 0, 0.03);
  state.lastTime = timestamp;

  if (state.running) {
    simulate(dt);
  }

  draw();
  requestAnimationFrame(loop);
}

function boot() {
  if (!canvas || !ctx) {
    return;
  }

  resetSlopeGeometry();

  state.slope.pos = world.slopeLength * 0.5;
  state.slope.initialPos = state.slope.pos;

  syncMassInputs();

  if (ui.slopeMass) {
    ui.slopeMass.addEventListener("input", () => {
      syncMassInputs();
      setStatus("Updated slope mass.");
    });
  }

  if (ui.hangingMass) {
    ui.hangingMass.addEventListener("input", () => {
      syncMassInputs();
      setStatus("Updated hanging mass.");
    });
  }

  if (ui.pulleyCorner) {
    ui.pulleyCorner.addEventListener("change", onPulleyCornerChange);
  }

  if (ui.playBtn) {
    ui.playBtn.addEventListener("click", startAnimation);
    ui.playBtn.addEventListener("pointerup", startAnimation);
  }

  if (ui.pauseBtn) {
    ui.pauseBtn.addEventListener("click", pauseAnimation);
    ui.pauseBtn.addEventListener("pointerup", pauseAnimation);
  }

  if (ui.resetBtn) {
    ui.resetBtn.addEventListener("click", resetSimulation);
    ui.resetBtn.addEventListener("pointerup", resetSimulation);
  }

  if (ui.calcToggle) {
    ui.calcToggle.addEventListener("change", toggleCalculations);
    toggleCalculations();
  }

  canvas.addEventListener("pointerdown", onCanvasPointerDown);
  canvas.addEventListener("pointermove", onCanvasPointerMove);
  canvas.addEventListener("pointerup", onCanvasPointerUp);
  canvas.addEventListener("pointercancel", onCanvasPointerUp);

  setStatus("Ready: drag pulley to tilt, then animate.");
  requestAnimationFrame(loop);
}

boot();
