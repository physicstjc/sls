// ============================================================================
// OSCILLATING PLATFORM SIMULATION
// This simulation demonstrates how normal contact force changes on a box
// placed on a platform undergoing simple harmonic motion (SHM)
// ============================================================================

// Canvas and context references
const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const graphCanvas = document.getElementById('graphCanvas');
const graphCtx = graphCanvas.getContext('2d');

// UI element references
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');
const resetBtn = document.getElementById('resetBtn');
const frequencySlider = document.getElementById('frequencySlider');
const frequencyValue = document.getElementById('frequencyValue');

// Display value references
const weightValueEl = document.getElementById('weightValue');
const normalValueEl = document.getElementById('normalValue');
const netForceValueEl = document.getElementById('netForceValue');
const accelValueEl = document.getElementById('accelValue');
const motionValueEl = document.getElementById('motionValue');

// ============================================================================
// SIMULATION PARAMETERS
// ============================================================================

// Physical constants
const g = 10; // Gravitational acceleration (m/s²) - simplified for Singapore curriculum
const mass = 5; // Mass of box (kg)
const weight = mass * g; // Weight of box (N)

// Simple Harmonic Motion parameters
// MODIFIED: Changed initial frequency to 0.2 Hz (within new range of 0.1-0.3 Hz)
let frequency = 0.2; // Oscillation frequency (Hz)
let omega = 2 * Math.PI * frequency; // Angular frequency (rad/s)
let amplitude = 60; // Amplitude of oscillation (pixels)
const equilibriumY = 200; // Equilibrium position of platform (pixels)

// Simulation state
let time = 0; // Current time (seconds)
let isPlaying = false; // Animation state
let lastTime = 0; // For delta time calculation

// Graph data storage
const graphData = [];
const maxGraphPoints = 200; // Maximum points to display on graph

// ============================================================================
// INITIALIZATION
// ============================================================================

// Set canvas sizes based on container
function resizeCanvas() {
    const leftPanel = canvas.parentElement;
    const rect = leftPanel.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height - 60; // Account for controls
    
    const graphContainer = graphCanvas.parentElement;
    const graphRect = graphContainer.getBoundingClientRect();
    graphCanvas.width = graphRect.width - 16;
    graphCanvas.height = graphRect.height - 30;
}

// Initialize on load
window.addEventListener('load', () => {
    resizeCanvas();
    draw();
    drawGraph();
});

window.addEventListener('resize', resizeCanvas);

// ============================================================================
// SIMPLE HARMONIC MOTION CALCULATIONS
// ============================================================================

// Calculate platform position using SHM equation: y = A * sin(ωt)
function getPlatformY(t) {
    return equilibriumY + amplitude * Math.sin(omega * t);
}

// Calculate platform velocity: v = Aω * cos(ωt)
function getPlatformVelocity(t) {
    return amplitude * omega * Math.cos(omega * t);
}

// Calculate platform acceleration: a = -Aω² * sin(ωt)
function getPlatformAcceleration(t) {
    return -amplitude * omega * omega * Math.sin(omega * t);
}

// ============================================================================
// FORCE CALCULATIONS
// ============================================================================

// Calculate normal force using Newton's second law: N = W + ma
// Where a is the acceleration of the platform (and box)
// IMPORTANT: Normal force is always upward (never negative)
// If calculation gives N < 0, the box would lose contact with platform
function calculateNormalForce(acceleration) {
    // Convert pixel acceleration to m/s²
    const accelMeters = acceleration / 10; // Scale factor for visualization
    
    // Normal force = Weight + mass * acceleration
    // When accelerating upward (positive a), N > W
    // When accelerating downward (negative a), N < W
    const normalForce = weight + mass * accelMeters;
    
    // MODIFICATION: Ensure normal force never goes negative
    // Normal force always points upward (perpendicular to surface)
    // If it would be negative, box loses contact with platform
    return Math.max(0, normalForce);
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

// Play/Pause button
playPauseBtn.addEventListener('click', () => {
    isPlaying = !isPlaying;
    playPauseIcon.textContent = isPlaying ? '⏸' : '▶';
    
    if (isPlaying) {
        lastTime = performance.now();
        requestAnimationFrame(animate);
    }
});

// Reset button
resetBtn.addEventListener('click', () => {
    time = 0;
    graphData.length = 0;
    isPlaying = false;
    playPauseIcon.textContent = '▶';
    draw();
    drawGraph();
    updateDisplayValues(0, 0, weight);
});

// Frequency slider
// MODIFIED: Updated to display frequency with 2 decimal places for better precision
frequencySlider.addEventListener('input', (e) => {
    frequency = parseFloat(e.target.value);
    omega = 2 * Math.PI * frequency;
    frequencyValue.textContent = frequency.toFixed(2) + ' Hz';
});

// ============================================================================
// ANIMATION LOOP
// ============================================================================

function animate(currentTime) {
    if (!isPlaying) return;
    
    // Calculate delta time
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    // Update time
    time += deltaTime;
    
    // Draw current frame
    draw();
    
    // Update graph
    const platformY = getPlatformY(time);
    const acceleration = getPlatformAcceleration(time);
    const normalForce = calculateNormalForce(acceleration);
    
    // Store data for graph
    graphData.push({ time: time, normalForce: normalForce });
    if (graphData.length > maxGraphPoints) {
        graphData.shift();
    }
    
    drawGraph();
    
    // Update display values
    updateDisplayValues(acceleration, getPlatformVelocity(time), normalForce);
    
    // Continue animation
    requestAnimationFrame(animate);
}

// ============================================================================
// DRAWING FUNCTIONS
// ============================================================================

function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate current positions
    const platformY = getPlatformY(time);
    const acceleration = getPlatformAcceleration(time);
    const velocity = getPlatformVelocity(time);
    const normalForce = calculateNormalForce(acceleration);
    
    // Draw reference line (equilibrium position)
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, equilibriumY);
    ctx.lineTo(canvas.width, equilibriumY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // MODIFIED: Draw simple vertical rod instead of rotating shaft mechanism
    // The rod extends from the bottom of the canvas to the platform
    drawVerticalRod(canvas.width / 2, canvas.height - 20, platformY);
    
    // Draw platform
    const platformWidth = 180;
    const platformHeight = 20;
    const platformX = canvas.width / 2 - platformWidth / 2;
    
    // Platform shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(platformX + 5, platformY + 5, platformWidth, platformHeight);
    
    // Platform
    ctx.fillStyle = '#34495e';
    ctx.fillRect(platformX, platformY, platformWidth, platformHeight);
    
    // Platform highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(platformX, platformY, platformWidth, 5);
    
    // Draw box on platform
    const boxSize = 60;
    const boxX = canvas.width / 2 - boxSize / 2;
    const boxY = platformY - boxSize;
    
    // Box shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(boxX + 3, boxY + 3, boxSize, boxSize);
    
    // Box
    const gradient = ctx.createLinearGradient(boxX, boxY, boxX + boxSize, boxY + boxSize);
    gradient.addColorStop(0, '#e74c3c');
    gradient.addColorStop(1, '#c0392b');
    ctx.fillStyle = gradient;
    ctx.fillRect(boxX, boxY, boxSize, boxSize);
    
    // Box outline
    ctx.strokeStyle = '#a93226';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxSize, boxSize);
    
    // Box highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(boxX + 5, boxY + 5, boxSize - 10, 10);
    
    // Draw force vectors
    // MODIFIED: Pass platform position to draw forces from platform surface
    drawForceVectors(boxX + boxSize / 2, boxY + boxSize / 2, platformY, normalForce);
    
    // Draw motion indicator
    drawMotionIndicator(velocity, acceleration);
}

// NEW FUNCTION: Draw simple vertical rod that moves up and down
// CHANGE: Replaced the rotating shaft mechanism with a simple vertical rod
// The rod connects from a fixed point at the bottom to the moving platform
function drawVerticalRod(centerX, bottomY, platformY) {
    // Rod connection point on platform
    const rodConnectionY = platformY + 10;
    
    // Draw the vertical rod
    ctx.strokeStyle = '#95a5a6';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(centerX, bottomY);
    ctx.lineTo(centerX, rodConnectionY);
    ctx.stroke();
    
    // Draw rod outline for depth effect
    ctx.strokeStyle = '#7f8c8d';
    ctx.lineWidth = 14;
    ctx.globalAlpha = 0.3;
    ctx.stroke();
    ctx.globalAlpha = 1.0;
    
    // Draw connection point at bottom (fixed base)
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(centerX, bottomY, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1a252f';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw center pin at bottom
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(centerX, bottomY, 6, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw connection point on platform (moving)
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.arc(centerX, rodConnectionY, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a6c7d';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Draw force vectors on the box
// MODIFIED: Both vectors now positioned very close to each other
// Weight vector color changed to green (#2ecc71)
function drawForceVectors(centerX, centerY, platformY, normalForce) {
    const arrowLength = 60;
    const normalScale = normalForce / weight;
    
    // MODIFIED: Both vectors now start from platform surface and are positioned very close together
    // Weight vector is now green and positioned just to the left of center
    const weightStartY = platformY;
    const weightX = centerX - 5; // Position weight vector slightly left of center
    drawArrow(weightX, weightStartY, weightX, weightStartY + arrowLength, '#2ecc71', 'W', 3);
    
    // MODIFIED: Normal force vector positioned very close to weight vector (just to the right)
    // This clearly shows both forces acting at the contact point between box and platform
    const normalLength = arrowLength * normalScale;
    const normalX = centerX + 5; // Position normal vector slightly right of center, very close to weight
    
    // Only draw normal force if it's greater than zero
    // If normal force is zero, box has lost contact with platform
    if (normalForce > 0) {
        // Normal force arrow starts from platform, very close to the weight vector
        drawArrow(normalX, platformY, normalX, platformY - normalLength, '#3498db', 'N', 3);
    } else {
        // If no contact, show a small indicator that N = 0
        ctx.fillStyle = '#3498db';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('N = 0', normalX, platformY - 10);
        ctx.fillText('(No contact)', normalX, platformY + 5);
    }
}

// Draw an arrow with label
function drawArrow(x1, y1, x2, y2, color, label, lineWidth = 2) {
    const headLength = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    // Arrow line
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    // Arrow head
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
        x2 - headLength * Math.cos(angle - Math.PI / 6),
        y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
        x2 - headLength * Math.cos(angle + Math.PI / 6),
        y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    // Label
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    
    if (y2 > y1) {
        ctx.fillText(label, x2, y2 + 20);
    } else {
        ctx.fillText(label, x2, y2 - 10);
    }
}

// Draw motion indicator showing direction and acceleration
function drawMotionIndicator(velocity, acceleration) {
    const x = 30;
    const y = 30;
    const size = 40;
    
    // Background circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Direction arrow
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    if (Math.abs(velocity) < 0.5) {
        ctx.fillText('●', x, y);
    } else if (velocity > 0) {
        ctx.fillText('↓', x, y);
    } else {
        ctx.fillText('↑', x, y);
    }
}

// ============================================================================
// GRAPH DRAWING
// ============================================================================

function drawGraph() {
    // Clear graph
    graphCtx.clearRect(0, 0, graphCanvas.width, graphCanvas.height);
    
    if (graphData.length < 2) return;
    
    const padding = 30;
    const graphWidth = graphCanvas.width - 2 * padding;
    const graphHeight = graphCanvas.height - 2 * padding;
    
    // Draw axes
    graphCtx.strokeStyle = '#333';
    graphCtx.lineWidth = 2;
    graphCtx.beginPath();
    graphCtx.moveTo(padding, padding);
    graphCtx.lineTo(padding, graphCanvas.height - padding);
    graphCtx.lineTo(graphCanvas.width - padding, graphCanvas.height - padding);
    graphCtx.stroke();
    
    // Find min and max values for scaling
    const forces = graphData.map(d => d.normalForce);
    // MODIFICATION: Ensure minimum force shown is 0 (never negative)
    const minForce = Math.min(...forces, 0);
    const maxForce = Math.max(...forces, weight + 20);
    const forceRange = maxForce - minForce;
    
    // Draw reference line for weight
    // MODIFIED: Changed weight reference line color to green to match weight vector
    const weightY = graphCanvas.height - padding - ((weight - minForce) / forceRange) * graphHeight;
    graphCtx.strokeStyle = '#2ecc71';
    graphCtx.lineWidth = 1;
    graphCtx.setLineDash([5, 5]);
    graphCtx.beginPath();
    graphCtx.moveTo(padding, weightY);
    graphCtx.lineTo(graphCanvas.width - padding, weightY);
    graphCtx.stroke();
    graphCtx.setLineDash([]);
    
    // Draw weight label
    // MODIFIED: Changed weight label color to green
    graphCtx.fillStyle = '#2ecc71';
    graphCtx.font = '10px Arial';
    graphCtx.textAlign = 'right';
    graphCtx.fillText('W', padding - 5, weightY + 3);
    
    // MODIFICATION: Draw zero line to show when normal force reaches zero
    const zeroY = graphCanvas.height - padding - ((0 - minForce) / forceRange) * graphHeight;
    graphCtx.strokeStyle = '#999';
    graphCtx.lineWidth = 1;
    graphCtx.setLineDash([3, 3]);
    graphCtx.beginPath();
    graphCtx.moveTo(padding, zeroY);
    graphCtx.lineTo(graphCanvas.width - padding, zeroY);
    graphCtx.stroke();
    graphCtx.setLineDash([]);
    
    // Draw normal force curve
    graphCtx.strokeStyle = '#3498db';
    graphCtx.lineWidth = 2;
    graphCtx.beginPath();
    
    for (let i = 0; i < graphData.length; i++) {
        const x = padding + (i / (maxGraphPoints - 1)) * graphWidth;
        const y = graphCanvas.height - padding - ((graphData[i].normalForce - minForce) / forceRange) * graphHeight;
        
        if (i === 0) {
            graphCtx.moveTo(x, y);
        } else {
            graphCtx.lineTo(x, y);
        }
    }
    
    graphCtx.stroke();
    
    // Draw axis labels
    graphCtx.fillStyle = '#333';
    graphCtx.font = '10px Arial';
    graphCtx.textAlign = 'center';
    graphCtx.fillText('Time', graphCanvas.width / 2, graphCanvas.height - 5);
    
    graphCtx.save();
    graphCtx.translate(10, graphCanvas.height / 2);
    graphCtx.rotate(-Math.PI / 2);
    graphCtx.fillText('Normal Force (N)', 0, 0);
    graphCtx.restore();
}

// ============================================================================
// UPDATE DISPLAY VALUES
// ============================================================================

function updateDisplayValues(acceleration, velocity, normalForce) {
    // Convert pixel acceleration to m/s²
    const accelMeters = acceleration / 10;
    
    // Update force values
    weightValueEl.textContent = weight.toFixed(1) + ' N';
    normalValueEl.textContent = normalForce.toFixed(1) + ' N';
    
    const netForce = normalForce - weight;
    netForceValueEl.textContent = netForce.toFixed(1) + ' N';
    
    // Color code net force
    if (netForce > 0.5) {
        netForceValueEl.style.color = '#3498db'; // Blue for upward
    } else if (netForce < -0.5) {
        netForceValueEl.style.color = '#e74c3c'; // Red for downward
    } else {
        netForceValueEl.style.color = '#2ecc71'; // Green for balanced
    }
    
    // Update acceleration
    accelValueEl.textContent = accelMeters.toFixed(2) + ' m/s²';
    
    // Update motion indicator
    if (Math.abs(velocity) < 0.5) {
        motionValueEl.textContent = 'At extremes';
    } else if (velocity > 0) {
        motionValueEl.textContent = 'Moving down ↓';
    } else {
        motionValueEl.textContent = 'Moving up ↑';
    }
    
    // Color code acceleration
    if (accelMeters > 0.1) {
        accelValueEl.style.color = '#e74c3c'; // Red for downward acceleration
    } else if (accelMeters < -0.1) {
        accelValueEl.style.color = '#3498db'; // Blue for upward acceleration
    } else {
        accelValueEl.style.color = '#2ecc71'; // Green for no acceleration
    }
}

// ============================================================================
// INITIAL DISPLAY
// ============================================================================

// Set initial display values
updateDisplayValues(0, 0, weight);