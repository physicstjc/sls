// --- Forces Checkbox ---
const showForcesCheckbox = document.getElementById('showForces');
let showForces = false;
if (showForcesCheckbox) {
  showForcesCheckbox.addEventListener('change', () => {
    showForces = showForcesCheckbox.checked;
    draw();
  });
}

// --- Force Drawing Helpers ---
function drawArrow(from, to, color, label, labelOffset = { x: 10, y: 0 }) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.shadowColor = color;
  ctx.shadowBlur = 6;
  ctx.stroke();
  // Arrowhead
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const headlen = 18;
  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - headlen * Math.cos(angle - Math.PI/7), to.y - headlen * Math.sin(angle - Math.PI/7));
  ctx.lineTo(to.x - headlen * Math.cos(angle + Math.PI/7), to.y - headlen * Math.sin(angle + Math.PI/7));
  ctx.lineTo(to.x, to.y);
  ctx.fillStyle = color;
  ctx.fill();
  // Label
  if (label) {
    const labelX = (from.x + to.x) / 2 + labelOffset.x;
    const labelY = (from.y + to.y) / 2 + labelOffset.y;
    ctx.font = 'bold 1.1em Courier New, monospace';
    ctx.fillStyle = color;
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 4;
    ctx.strokeText(label, labelX, labelY);
    ctx.lineWidth = 1;
    ctx.fillText(label, labelX, labelY);
  }
  ctx.restore();
}

function drawForcesFlat(cog, baseIndices) {
  // Weight (down from CoG)
  drawArrow(cog, {x: cog.x, y: cog.y + 80}, '#0077ff', 'Weight');
  // Normal force (up from midpoint of base)
  const p1 = corners[baseIndices[0]];
  const p2 = corners[baseIndices[1]];
  const mid = {x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2};
  drawArrow(mid, {x: mid.x, y: mid.y - 80}, '#00b700', 'Normal');
}

function drawForcesTilted(cog, pivotIdx) {
  // Weight (down from CoG)
  drawArrow(cog, {x: cog.x, y: cog.y + 80}, '#0077ff', 'Weight');
  // Contact force at pivot (up/right or up/left from pivot)
  const pivot = corners[pivotIdx];
  // Direction: from pivot to CoG, but only the perpendicular (normal) component
  const dx = cog.x - pivot.x;
  const dy = cog.y - pivot.y;
  const len = Math.sqrt(dx*dx + dy*dy);
  // Normalized direction (perpendicular to edge)
  const nx = -dy/len;
  const ny = dx/len;
  // Contact force: up and away from pivot
  const forceLen = 80;
  drawArrow(pivot, {x: pivot.x + nx*forceLen, y: pivot.y + ny*forceLen}, '#ff3b3b', 'Contact');
}
// Neo-brutalism color palette
const COLORS = {
  border: '#222',
  background: '#fff',
  object: '#ffb800',
  accent: '#00b7ff',
  danger: '#ff3b3b',
  shadow: '#222',
  handle: '#ff3b3b',
};

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const cogDisplay = document.getElementById('cogDisplay');
const statusDisplay = document.getElementById('statusDisplay');

// Canvas parameters
const CONTROL_BAND_HEIGHT = 120;
const FLOOR_Y = canvas.height - CONTROL_BAND_HEIGHT;
const MARGIN = 50;

// Initial rectangle corners
const ORIGINAL_CORNERS = [
  { x: 250, y: FLOOR_Y },      // bottom left
  { x: 450, y: FLOOR_Y },      // bottom right
  { x: 450, y: FLOOR_Y - 300 }, // top right
  { x: 250, y: FLOOR_Y - 300 }, // top left
];
let corners = ORIGINAL_CORNERS.map(pt => ({...pt}));
// Reset button logic
const resetBtn = document.getElementById('resetBtn');
if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    // Restore corners to original
    for (let i = 0; i < corners.length; i++) {
      corners[i].x = ORIGINAL_CORNERS[i].x;
      corners[i].y = ORIGINAL_CORNERS[i].y;
    }
    // Reset state variables
    draggingCorner = null;
    isDraggingObject = false;
    dragStart = null;
    activePivot = null;
    pushAngle = 0;
    isAnimating = false;
    animationMode = null;
    angle = 0;
    angularVelocity = 0;
    window.leftBase = null;
    window.rightBase = null;
    draw();
    updateStatus('Reset to original');
  });
}

// State variables
let draggingCorner = null;
let isDraggingObject = false;
let dragStart = null;
let activePivot = null;
let pushAngle = 0;
let isAnimating = false;
let animationMode = null; // 'topple' or 'settle'
let lastMouse = { x: 0, y: 0 };
let baseStatusText = 'Ready';

// Animation variables
let angle = 0;
let angularVelocity = 0;
const FORCE_ARROW_LENGTH = 72;

/**
 * Calculate polygon centroid using Shoelace formula
 */
function calculateCentroid(points) {
  let area = 0;
  let cx = 0;
  let cy = 0;

  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const cross = points[i].x * points[j].y - points[j].x * points[i].y;
    area += cross;
    cx += (points[i].x + points[j].x) * cross;
    cy += (points[i].y + points[j].y) * cross;
  }

  area *= 0.5;
  cx /= 6 * area;
  cy /= 6 * area;

  return { x: cx, y: cy };
}

/**
 * Find the two base corner indices (the two corners with largest y values)
 * Does NOT mutate `corners` — returns indices for use when selecting pivots.
 */
function getBaseIndices() {
  let baseIndices = [];
  let baseYs = [-Infinity, -Infinity];

  for (let i = 0; i < corners.length; i++) {
    if (corners[i].y > baseYs[0]) {
      baseYs[1] = baseYs[0];
      baseIndices[1] = baseIndices[0];
      baseYs[0] = corners[i].y;
      baseIndices[0] = i;
    } else if (corners[i].y > baseYs[1]) {
      baseYs[1] = corners[i].y;
      baseIndices[1] = i;
    }
  }

  return baseIndices;
}

/**
 * Rotate a point around a pivot
 */
function rotatePoint(point, pivot, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;

  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

/**
 * Get distance between two points
 */
function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function crossProduct(origin, pointA, pointB) {
  return (pointA.x - origin.x) * (pointB.y - origin.y) - (pointA.y - origin.y) * (pointB.x - origin.x);
}

function isConvexPolygon(points) {
  const epsilon = 0.001;
  let windingSign = 0;

  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const nextNext = points[(i + 2) % points.length];
    const cross = crossProduct(current, next, nextNext);

    if (Math.abs(cross) < epsilon) {
      return false;
    }

    const currentSign = Math.sign(cross);
    if (windingSign === 0) {
      windingSign = currentSign;
    } else if (currentSign !== windingSign) {
      return false;
    }
  }

  return true;
}

function canMoveCorner(cornerIndex, nextPoint) {
  const candidateCorners = corners.map((corner, index) => (
    index === cornerIndex ? { x: nextPoint.x, y: nextPoint.y } : { x: corner.x, y: corner.y }
  ));

  return isConvexPolygon(candidateCorners);
}

function snapPolygonToFloor(polygon) {
  const lowestY = Math.max(...polygon.map((point) => point.y));
  const shiftY = FLOOR_Y - lowestY;

  return polygon.map((point) => ({
    x: point.x,
    y: point.y + shiftY,
  }));
}

function getShiftedPolygonAtAngle(sourceCorners, pivotIndex, rotationAngle) {
  const pivot = sourceCorners[pivotIndex];
  const rotated = sourceCorners.map((pt) => rotatePoint(pt, pivot, rotationAngle));
  const shiftY = sourceCorners[pivotIndex].y - rotated[pivotIndex].y;

  return rotated.map((pt) => ({ x: pt.x, y: pt.y + shiftY }));
}

function countFloorContacts(polygon, epsilon = 1.0) {
  return polygon.reduce(
    (count, point) => count + (Math.abs(point.y - FLOOR_Y) <= epsilon ? 1 : 0),
    0
  );
}

function findLandingPolygon(sourceCorners, pivotIndex, startAngle, endAngle) {
  let lowT = 0;
  let highT = 1;

  for (let i = 0; i < 24; i++) {
    const midT = (lowT + highT) / 2;
    const testAngle = startAngle + (endAngle - startAngle) * midT;
    const polygon = getShiftedPolygonAtAngle(sourceCorners, pivotIndex, testAngle);
    const maxY = Math.max(...polygon.map((point, index) => (
      index === pivotIndex ? -Infinity : point.y
    )));

    if (maxY > FLOOR_Y) {
      highT = midT;
    } else {
      lowT = midT;
    }
  }

  const landingAngle = startAngle + (endAngle - startAngle) * lowT;
  return snapPolygonToFloor(getShiftedPolygonAtAngle(sourceCorners, pivotIndex, landingAngle));
}

/**
 * Check if point is inside polygon (ray casting algorithm)
 */
function isPointInPolygon(point, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Draw the floor
 */
function drawFloor() {
  ctx.save();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(canvas.width, FLOOR_Y);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw shadow beneath object
 */
function drawShadow(polygon) {
  ctx.save();
  ctx.translate(8, 8);
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.shadow;
  ctx.globalAlpha = 0.15;
  ctx.fill();
  ctx.restore();
}

/**
 * Draw polygon object
 */
function drawPolygon(polygon) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(polygon[0].x, polygon[0].y);
  for (let i = 1; i < polygon.length; i++) {
    ctx.lineTo(polygon[i].x, polygon[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = COLORS.object;
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw corner handles
 */
function drawCorners(polygon) {
  for (let i = 0; i < polygon.length; i++) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(polygon[i].x, polygon[i].y, 12, 0, 2 * Math.PI);
    ctx.fillStyle = COLORS.handle;
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }
}

/**
 * Draw center of gravity indicator
 */
function drawCOG(cog) {
  // Main circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cog.x, cog.y, 10, 0, 2 * Math.PI);
  ctx.fillStyle = COLORS.accent;
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // Crosshair
  ctx.save();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cog.x - 15, cog.y);
  ctx.lineTo(cog.x + 15, cog.y);
  ctx.moveTo(cog.x, cog.y - 15);
  ctx.lineTo(cog.x, cog.y + 15);
  ctx.stroke();
  ctx.restore();
}

/**
 * Draw line of action (vertical dashed line from CoG to floor)
 */
function drawLineOfAction(cog) {
  ctx.save();
  ctx.strokeStyle = COLORS.accent;
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(cog.x, cog.y);
  ctx.lineTo(cog.x, FLOOR_Y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

/**
 * Draw pivot indicator
 */
function drawPivotIndicator(pivot) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(pivot.x, pivot.y, 18, 0, 2 * Math.PI);
  ctx.strokeStyle = COLORS.danger;
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.restore();
}

function drawForcesForPolygon(polygon, cog, pivotIdx = null) {
  if (!showForces) return;

  const eps = 1.5;
  const floorContacts = polygon
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => Math.abs(point.y - FLOOR_Y) < eps);

  if (floorContacts.length >= 2) {
    drawArrow(cog, { x: cog.x, y: cog.y + FORCE_ARROW_LENGTH }, '#0077ff', 'Weight', { x: 12, y: 18 });
    const normalBase = {
      x: cog.x,
      y: FLOOR_Y,
    };
    drawArrow(
      normalBase,
      { x: normalBase.x, y: normalBase.y - FORCE_ARROW_LENGTH },
      '#00b700',
      'Normal',
      { x: -74, y: -12 }
    );
    return;
  }

  if (pivotIdx !== null && pivotIdx !== undefined) {
    drawArrow(cog, { x: cog.x, y: cog.y + FORCE_ARROW_LENGTH }, '#0077ff', 'Weight', { x: 12, y: 18 });
    const pivot = polygon[pivotIdx];
    drawArrow(
      pivot,
      { x: pivot.x, y: pivot.y - FORCE_ARROW_LENGTH },
      '#ff3b3b',
      'Normal',
      { x: -74, y: -12 }
    );
  }
}

function getFloorContacts(polygon, epsilon = 1.5) {
  return polygon
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => Math.abs(point.y - FLOOR_Y) < epsilon);
}

function isPolygonInEquilibrium(polygon, cog, pivotIdx = null) {
  const supportEpsilon = 1.5;
  const floorContacts = getFloorContacts(polygon, supportEpsilon);

  if (floorContacts.length >= 2) {
    const supportXs = floorContacts.map(({ point }) => point.x);
    const minSupportX = Math.min(...supportXs);
    const maxSupportX = Math.max(...supportXs);
    return cog.x >= minSupportX - supportEpsilon && cog.x <= maxSupportX + supportEpsilon;
  }

  if (pivotIdx !== null && pivotIdx !== undefined) {
    return Math.abs(cog.x - polygon[pivotIdx].x) <= supportEpsilon;
  }

  return true;
}

function renderStatusForPolygon(polygon, cog, pivotIdx = null) {
  if (!statusDisplay) return;

  const warning = isPolygonInEquilibrium(polygon, cog, pivotIdx)
    ? ''
    : ' - Not in equilibrium';

  statusDisplay.textContent = `${baseStatusText}${warning}`;
}

function drawDisequilibriumWarning(polygon, cog, pivotIdx = null) {
  if (isPolygonInEquilibrium(polygon, cog, pivotIdx)) return;

  const warningText = 'WARNING: NOT IN EQUILIBRIUM';
  const boxX = 22;
  const boxY = 22;
  const horizontalPadding = 16;
  const maxBoxWidth = canvas.width - 44;

  ctx.save();
  let fontSize = 22;
  ctx.font = `bold ${fontSize}px Courier New, monospace`;
  let textWidth = ctx.measureText(warningText).width;
  while (textWidth + horizontalPadding * 2 > maxBoxWidth && fontSize > 14) {
    fontSize -= 1;
    ctx.font = `bold ${fontSize}px Courier New, monospace`;
    textWidth = ctx.measureText(warningText).width;
  }

  const boxWidth = Math.min(maxBoxWidth, textWidth + horizontalPadding * 2);
  const boxHeight = fontSize + 20;

  ctx.fillStyle = 'rgba(255, 59, 59, 0.14)';
  ctx.strokeStyle = COLORS.danger;
  ctx.lineWidth = 4;
  ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
  ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  ctx.fillStyle = COLORS.danger;
  ctx.textBaseline = 'middle';
  ctx.fillText(warningText, boxX + horizontalPadding, boxY + boxHeight / 2);
  ctx.restore();
}

/**
 * Main draw function
 */
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFloor();
  drawShadow(corners);
  drawPolygon(corners);
  drawCorners(corners);

  const cog = calculateCentroid(corners);
  drawCOG(cog);
  drawForcesForPolygon(corners, cog, activePivot);
  drawDisequilibriumWarning(corners, cog, activePivot);
  updateCOGDisplay(cog);
  renderStatusForPolygon(corners, cog, activePivot);
}

/**
 * Draw during push (shows line of action)
 */
function drawDuringPush(polygon, cog) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFloor();
  drawShadow(polygon);
  drawPolygon(polygon);
  drawCorners(polygon);
  drawCOG(cog);
  drawForcesForPolygon(polygon, cog, activePivot);
  drawLineOfAction(cog);
  if (activePivot !== null) {
    drawPivotIndicator(polygon[activePivot]);
  }
  drawDisequilibriumWarning(polygon, cog, activePivot);
  updateCOGDisplay(cog);
  renderStatusForPolygon(polygon, cog, activePivot);
}

/**
 * Draw during animation
 */
function drawDuringAnimation(polygon, cog) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawFloor();
  drawShadow(polygon);
  drawPolygon(polygon);
  drawCorners(polygon);
  drawCOG(cog);
  drawForcesForPolygon(polygon, cog, activePivot);
  if (activePivot !== null) {
    drawPivotIndicator(polygon[activePivot]);
  }
  drawDisequilibriumWarning(polygon, cog, activePivot);
  updateCOGDisplay(cog);
  renderStatusForPolygon(polygon, cog, activePivot);
}

/**
 * Update CoG display in sidebar
 */
function updateCOGDisplay(cog) {
  cogDisplay.textContent = `CoG: (${cog.x.toFixed(1)}, ${cog.y.toFixed(1)})`;
}

/**
 * Update status display
 */
function updateStatus(text) {
  baseStatusText = text;
  statusDisplay.textContent = text;
}

// ============ EVENT HANDLERS ============

canvas.addEventListener('mousedown', (e) => {
  if (isAnimating) return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  lastMouse = { x: mx, y: my };

  // Check if clicking on a corner
  for (let i = 0; i < corners.length; i++) {
    if (distance({ x: mx, y: my }, corners[i]) < 18) {
      draggingCorner = i;
      updateStatus('Reshaping...');
      return;
    }
  }

  // Check if clicking inside polygon
  if (isPointInPolygon({ x: mx, y: my }, corners)) {
    isDraggingObject = true;
    dragStart = { x: mx, y: my };

    // Get the two base corners and store for later use (non-mutating)
    const baseIndices = getBaseIndices();
    const base1 = baseIndices[0];
    const base2 = baseIndices[1];
    
    // Store base corners globally for use in mousemove
    const leftBaseIdx = corners[base1].x < corners[base2].x ? base1 : base2;
    const rightBaseIdx = corners[base1].x > corners[base2].x ? base1 : base2;

    // Snap the two base corners to the floor now (only these two)
    corners[leftBaseIdx].y = FLOOR_Y;
    corners[rightBaseIdx].y = FLOOR_Y;

    window.leftBase = leftBaseIdx;
    window.rightBase = rightBaseIdx;

    pushAngle = 0;
    activePivot = null; // Will be determined during mousemove based on drag direction
    updateStatus('Dragging...');
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (isAnimating) return;

  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // Handle corner dragging
  if (draggingCorner !== null) {
    const baseIndices = getBaseIndices();
    const isBaseCorner = baseIndices.includes(draggingCorner);
    const candidatePoint = {
      x: mx,
      y: isBaseCorner ? FLOOR_Y : Math.max(MARGIN, Math.min(FLOOR_Y, my)),
    };

    // Allow horizontal movement off-canvas so the table is effectively infinite.
    if (canMoveCorner(draggingCorner, candidatePoint)) {
      corners[draggingCorner].x = candidatePoint.x;
      // Keep base corners on the floor while allowing other corners to move vertically.
      corners[draggingCorner].y = candidatePoint.y;
      draw();
    }
  }
  // Handle object dragging
  else if (isDraggingObject && dragStart) {
    // Note: base corners were normalized at drag start (mousedown),
    // do not re-normalize here to preserve the user-defined shape.
    // Determine pivot based on drag direction
    // If dragging left, use left pivot; if dragging right, use right pivot
    if (mx < dragStart.x) {
      activePivot = window.leftBase; // Dragging left
    } else if (mx > dragStart.x) {
      activePivot = window.rightBase; // Dragging right
    }
    // If mx === dragStart.x, keep the current pivot (or it remains null)
    
    // Only proceed if a pivot is selected
    if (activePivot !== null && activePivot !== undefined) {
      const pivot = corners[activePivot];
      const dx = mx - pivot.x;
      const dy = my - pivot.y;
      const dragDx = dragStart.x - pivot.x;
      const dragDy = dragStart.y - pivot.y;

      // Calculate angle rotated
      const angle1 = Math.atan2(dragDy, dragDx);
      const angle2 = Math.atan2(dy, dx);
      pushAngle = angle2 - angle1;

      // Rotate corners for preview
      const rotated = corners.map((pt) => rotatePoint(pt, pivot, pushAngle));
      
      // Keep pivot on floor
      let shift = corners[activePivot].y - rotated[activePivot].y;
      let shifted = rotated.map((pt) => ({ x: pt.x, y: pt.y + shift }));

      // Ensure no corner goes underground
      const minY = Math.min(...shifted.map(pt => pt.y));
      if (minY > FLOOR_Y) {
        shift += (FLOOR_Y - minY);
        shifted = rotated.map((pt) => ({ x: pt.x, y: pt.y + shift }));
      }

      const cog = calculateCentroid(shifted);
      
      // Check stability dynamically during drag
      const pivotX = shifted[activePivot].x;
      let willTopple = false;
      if (activePivot === window.leftBase) {
        // Left pivot: topple if CoG moves to the left
        willTopple = cog.x < pivotX;
      } else if (activePivot === window.rightBase) {
        // Right pivot: topple if CoG moves to the right
        willTopple = cog.x > pivotX;
      }

      // If CoG passes pivot, initiate topple immediately
      if (willTopple) {
        isDraggingObject = false;
        dragStart = null;
        startToppleAnimation();
        updateStatus('TOPPLING!');
      } else {
        updateStatus(`Pushing (pivot: ${activePivot === window.leftBase ? 'LEFT' : 'RIGHT'})`);
        drawDuringPush(shifted, cog);
      }
    }
  }

  lastMouse = { x: mx, y: my };
});

canvas.addEventListener('mouseup', (e) => {
  if (isAnimating) return;

  if (draggingCorner !== null) {
    draggingCorner = null;
    draw();
    updateStatus('Ready');
  } else if (isDraggingObject) {
    isDraggingObject = false;
    dragStart = null;

    // Determine base corners (do not mutate original corners)
    const _baseIndices = getBaseIndices();
    
    // Only check stability if a pivot was determined during drag
    if (activePivot !== null && activePivot !== undefined) {
      // Check stability
      const pivot = corners[activePivot];
      const rotated = corners.map((pt) => rotatePoint(pt, pivot, pushAngle));
      let shift = corners[activePivot].y - rotated[activePivot].y;
      let shifted = rotated.map((pt) => ({ x: pt.x, y: pt.y + shift }));

      // Ensure no corner goes underground
      const minY = Math.min(...shifted.map(pt => pt.y));
      if (minY > FLOOR_Y) {
        shift += (FLOOR_Y - minY);
        shifted = rotated.map((pt) => ({ x: pt.x, y: pt.y + shift }));
      }

      const cog = calculateCentroid(shifted);
      const pivotX = shifted[activePivot].x;

      // Determine if object will topple
      let willTopple = false;
      if (activePivot === window.leftBase) {
        // Left pivot: topple if CoG moves to the left
        willTopple = cog.x < pivotX;
      } else if (activePivot === window.rightBase) {
        // Right pivot: topple if CoG moves to the right
        willTopple = cog.x > pivotX;
      }

      if (willTopple) {
        startToppleAnimation();
        updateStatus('TOPPLING!');
      } else {
        startSettleAnimation();
        updateStatus('Stable - settling');
      }
    } else {
      // No significant drag - just reset
      activePivot = null;
      window.leftBase = null;
      window.rightBase = null;
      draw();
      updateStatus('Ready');
    }
  }
});

// ============ ANIMATION ============

/**
 * Start topple animation (rotate 90 degrees)
 */
function startToppleAnimation() {
  isAnimating = true;
  animationMode = 'topple';
  angle = pushAngle;
  angularVelocity = 0;

  // Start by rotating toward 90 degrees, but allow extending farther
  // if that first target is not yet enough to create a stable landing.
  let targetAngle = angle > 0 ? Math.PI / 2 : -Math.PI / 2;
  
  function toppleFrame() {
    if (!isAnimating || animationMode !== 'topple') return;

    // Smoothly interpolate towards targetAngle (may be extended to 180° if needed)
    let diff = targetAngle - angle;
    // If we're extremely close and haven't met contact condition, allow extending target
    if (Math.abs(diff) < 0.02) {
      angle = targetAngle;
      // don't complete yet — we'll check contact condition below and possibly extend rotation
      diff = 0;
    }

    const previousAngle = angle;

    // Move towards target
    angle += diff * 0.08;

    let shifted = getShiftedPolygonAtAngle(corners, activePivot, angle);

    // Count corners contacting the floor (including pivot)
    const contactEps = 1.0; // tolerance in pixels
    const contactCount = countFloorContacts(shifted, contactEps);
    const maxNonPivotY = Math.max(...shifted.map((point, index) => (
      index === activePivot ? -Infinity : point.y
    )));

    if (maxNonPivotY > FLOOR_Y + contactEps) {
      shifted = findLandingPolygon(corners, activePivot, previousAngle, angle);

      for (let k = 0; k < corners.length; k++) {
        corners[k].x = shifted[k].x;
        corners[k].y = shifted[k].y;
      }
      isAnimating = false;
      animationMode = null;
      activePivot = null;
      angle = 0;
      angularVelocity = 0;
      window.leftBase = null;
      window.rightBase = null;
      draw();
      updateStatus('Contact - rotation stopped');
      return;
    }

    // If two or more corners are (or would be) on the floor, snap them and finish rotation
    if (contactCount >= 2) {
      shifted = snapPolygonToFloor(shifted);
      // Commit rotated shape without deforming it on impact
      for (let k = 0; k < corners.length; k++) {
        corners[k].x = shifted[k].x;
        corners[k].y = shifted[k].y;
      }
      isAnimating = false;
      animationMode = null;
      activePivot = null;
      angle = 0;
      angularVelocity = 0;
      window.leftBase = null;
      window.rightBase = null;
      draw();
      updateStatus('Contact - rotation stopped');
      return;
    }

    // Ensure no corner goes underground during normal motion
    const maxY = Math.max(...shifted.map((point) => point.y));
    if (maxY > FLOOR_Y) {
      shifted = snapPolygonToFloor(shifted);
    }

    const cog = calculateCentroid(shifted);
    drawDuringAnimation(shifted, cog);
    // If we've reached the current targetAngle (e.g., 90°) but haven't contacted two corners,
    // extend the target to 180° in the same direction to continue rotation until two contacts or full rotation.
    if (Math.abs(targetAngle - angle) < 0.02) {
      // if current target was 90°, extend toward 180°
      if (Math.abs(targetAngle) === Math.PI / 2) {
        targetAngle = targetAngle > 0 ? Math.PI : -Math.PI;
      }
    }

    requestAnimationFrame(toppleFrame);
  }

  toppleFrame();
}

/**
 * Complete topple animation and update corners
 */
function completeToppleAnimation() {
  const pivot = corners[activePivot];
  const targetAngle = angle > 0 ? Math.PI / 2 : -Math.PI / 2;
  const rotated = corners.map((pt) => rotatePoint(pt, pivot, targetAngle));
  let shift = corners[activePivot].y - rotated[activePivot].y;
  let shifted = rotated.map((pt) => ({ x: pt.x, y: pt.y + shift }));

  // Ensure no corner goes underground
  const minY = Math.min(...shifted.map(pt => pt.y));
  if (minY > FLOOR_Y) {
    shift += (FLOOR_Y - minY);
    shifted = rotated.map((pt) => ({ x: pt.x, y: pt.y + shift }));
  }

  // Update corners to new position
  for (let i = 0; i < corners.length; i++) {
    corners[i].x = shifted[i].x;
    corners[i].y = shifted[i].y;
  }
  // Ensure pivot remains exactly on the floor after completion
  if (activePivot !== null && activePivot !== undefined) {
    corners[activePivot].y = FLOOR_Y;
  }

  isAnimating = false;
  activePivot = null;
  angle = 0;
  angularVelocity = 0;
  window.leftBase = null;
  window.rightBase = null;
  draw();
  updateStatus('Toppled! Ready');
}

/**
 * Start settle animation (damped oscillation back to stable position)
 */
function startSettleAnimation() {
  isAnimating = true;
  animationMode = 'settle';
  angle = pushAngle;
  angularVelocity = 0;

  function settleFrame() {
    if (!isAnimating || animationMode !== 'settle') return;

    // Damped oscillation
    const damping = 0.12;
    const stiffness = 0.18;
    const angularAccel = -stiffness * angle - damping * angularVelocity;
    angularVelocity += angularAccel;
    angularVelocity *= 0.96;
    angle += angularVelocity;

    // Stop when settled
    if (Math.abs(angle) < 0.005 && Math.abs(angularVelocity) < 0.005) {
      isAnimating = false;
      activePivot = null;
      angle = 0;
      window.leftBase = null;
      window.rightBase = null;
      draw();
      updateStatus('Settled. Ready');
      return;
    }

    const pivot = corners[activePivot];
    const rotated = corners.map((pt) => rotatePoint(pt, pivot, angle));
    let shift = corners[activePivot].y - rotated[activePivot].y;
    let shifted = rotated.map((pt) => ({ x: pt.x, y: pt.y + shift }));

    // Ensure no corner goes underground
    const minY = Math.min(...shifted.map(pt => pt.y));
    if (minY > FLOOR_Y) {
      shift += (FLOOR_Y - minY);
      shifted = rotated.map((pt) => ({ x: pt.x, y: pt.y + shift }));
    }

    const cog = calculateCentroid(shifted);
    drawDuringAnimation(shifted, cog);

    requestAnimationFrame(settleFrame);
  }

  settleFrame();
}

// Initial draw
draw();
updateStatus('Ready');
