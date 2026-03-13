// Constants for physics calculations
const g = 9.8; // Acceleration due to gravity (m/s²)

// Canvas and context
let canvas, ctx;

// Simulation parameters
let angle = 30; // Angle of inclination in degrees
let mass = 5.0; // Mass of the object in kg

// Toggle states for force vectors
// MODIFIED: Changed default state for weight components to false (hidden by default)
let showWeight = true;
let showNormal = true;
let showParallel = false;
let showPerpendicular = false;

// Force values
let weight, normalForce, parallelComponent, perpendicularComponent;

// Animation and interaction
let animationFrame;
let isDragging = false;

// Initialize the simulation when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeCanvas();
    initializeControls();
    calculateForces();
    updateDisplay();
    animate();
});

// Initialize canvas and set up resize handling
function initializeCanvas() {
    canvas = document.getElementById('simulationCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas size to match display size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
}

// Resize canvas to match container size
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight - document.querySelector('.control-panel').offsetHeight;
}

// Initialize all control elements and event listeners
function initializeControls() {
    // Angle slider
    const angleSlider = document.getElementById('angleSlider');
    const angleValue = document.getElementById('angleValue');
    
    angleSlider.addEventListener('input', function() {
        angle = parseFloat(this.value);
        angleValue.textContent = angle;
        calculateForces();
        updateDisplay();
    });
    
    // Mass slider
    const massSlider = document.getElementById('massSlider');
    const massValue = document.getElementById('massValue');
    
    massSlider.addEventListener('input', function() {
        mass = parseFloat(this.value);
        massValue.textContent = mass.toFixed(1);
        calculateForces();
        updateDisplay();
    });
    
    // Toggle checkboxes
    document.getElementById('showWeight').addEventListener('change', function() {
        showWeight = this.checked;
    });
    
    document.getElementById('showNormal').addEventListener('change', function() {
        showNormal = this.checked;
    });
    
    document.getElementById('showParallel').addEventListener('change', function() {
        showParallel = this.checked;
    });
    
    document.getElementById('showPerpendicular').addEventListener('change', function() {
        showPerpendicular = this.checked;
    });
    
    // Canvas interaction for tooltips
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);
}

// Calculate all force components based on current angle and mass
function calculateForces() {
    // Weight (W = mg)
    weight = mass * g;
    
    // Convert angle to radians for calculations
    const angleRad = angle * Math.PI / 180;
    
    // Normal force (N = W cos θ)
    normalForce = weight * Math.cos(angleRad);
    
    // Parallel component (W sin θ)
    parallelComponent = weight * Math.sin(angleRad);
    
    // Perpendicular component (W cos θ)
    perpendicularComponent = weight * Math.cos(angleRad);
}

// Update all display values in the info panel
function updateDisplay() {
    document.getElementById('weightValue').textContent = weight.toFixed(1) + ' N';
    document.getElementById('normalValue').textContent = normalForce.toFixed(1) + ' N';
    document.getElementById('parallelValue').textContent = parallelComponent.toFixed(1) + ' N';
    document.getElementById('perpendicularValue').textContent = perpendicularComponent.toFixed(1) + ' N';
}

// Main animation loop
function animate() {
    drawSimulation();
    animationFrame = requestAnimationFrame(animate);
}

// Draw the entire simulation scene
function drawSimulation() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate dimensions and positions
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const planeLength = Math.min(canvas.width, canvas.height) * 0.6;
    const blockSize = 50;
    
    // Convert angle to radians - negate for correct anti-clockwise rotation
    const angleRad = -angle * Math.PI / 180;
    
    // Calculate inclined plane endpoints
    const planeStartX = centerX - planeLength / 2 * Math.cos(angleRad);
    const planeStartY = centerY - planeLength / 2 * Math.sin(angleRad);
    const planeEndX = centerX + planeLength / 2 * Math.cos(angleRad);
    const planeEndY = centerY + planeLength / 2 * Math.sin(angleRad);
    
    // Draw ground
    drawGround(planeStartX, planeStartY);
    
    // Draw inclined plane
    drawInclinedPlane(planeStartX, planeStartY, planeEndX, planeEndY);
    
    // MODIFIED: Further lowered block position - changed from blockSize/4 to blockSize/8 for better alignment with slope
    const blockX = centerX + (blockSize / 8) * Math.sin(angleRad);
    const blockY = centerY - (blockSize / 8) * Math.cos(angleRad);
    
    // Draw block with base aligned to the slope
    drawBlock(blockX, blockY, blockSize, angleRad);
    
    // Draw force vectors
    const forceScale = 2; // Scale factor for vector visualization
    
    // Weight vector always points downward (positive Y direction)
    if (showWeight) {
        drawVector(blockX, blockY, 0, weight * forceScale, '#FF0000', 'W', true, false);
    }
    
    // Normal force perpendicular to inclined plane surface
    if (showNormal) {
        const normalX = normalForce * forceScale * Math.sin(angleRad);
        const normalY = -normalForce * forceScale * Math.cos(angleRad);
        drawVector(blockX, blockY, normalX, normalY, '#0000FF', 'N', false, false);
    }
    
    // Parallel component along the inclined plane - points down the slope
    if (showParallel) {
        const parallelX = -parallelComponent * forceScale * Math.cos(angleRad);
        const parallelY = -parallelComponent * forceScale * Math.sin(angleRad);
        drawVector(blockX, blockY, parallelX, parallelY, '#FF0000', 'W sin θ', false, true);
    }
    
    // Perpendicular component perpendicular to the plane (into the plane) - uses weight color and dotted line
    if (showPerpendicular) {
        const perpX = -perpendicularComponent * forceScale * Math.sin(angleRad);
        const perpY = perpendicularComponent * forceScale * Math.cos(angleRad);
        drawVector(blockX, blockY, perpX, perpY, '#FF0000', 'W cos θ', false, true);
    }
    
    // Draw angle indicator with correct angle
    drawAngleIndicator(planeStartX, planeStartY, angleRad);
    
    // Draw legend
    drawLegend();
}

// Draw the ground surface
function drawGround(x, y) {
    ctx.save();
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
    
    // Draw ground pattern
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, y);
        ctx.lineTo(i + 10, y + 10);
        ctx.stroke();
    }
    ctx.restore();
}

// Draw the inclined plane
function drawInclinedPlane(x1, y1, x2, y2) {
    ctx.save();
    
    // Draw plane surface with gradient
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, '#D0D0D0');
    gradient.addColorStop(1, '#A0A0A0');
    
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2, y1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw plane surface line
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    
    ctx.restore();
}

// Draw the block on the inclined plane with bottom edge resting on slope
function drawBlock(x, y, size, angleRad) {
    ctx.save();
    ctx.translate(x, y);
    // Rotate block to match the incline angle
    ctx.rotate(angleRad);
    
    // Draw block shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.fillRect(-size/2 + 3, -size + 3, size, size);
    
    // Draw block with gradient
    const gradient = ctx.createLinearGradient(-size/2, -size, size/2, 0);
    gradient.addColorStop(0, '#4A90E2');
    gradient.addColorStop(1, '#357ABD');
    
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#2C5F8D';
    ctx.lineWidth = 2;
    ctx.fillRect(-size/2, -size, size, size);
    ctx.strokeRect(-size/2, -size, size, size);
    
    // Draw mass label on block (centered in the box)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mass.toFixed(1) + ' kg', 0, -size/2);
    
    ctx.restore();
}

// Draw a force vector with arrow and label, with optional dotted line style
function drawVector(startX, startY, dx, dy, color, label, isVertical, isDotted) {
    if (Math.abs(dx) < 0.1 && Math.abs(dy) < 0.1) return;
    
    ctx.save();
    
    const endX = startX + dx;
    const endY = startY + dy;
    
    // Draw vector line
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;
    
    // Set line dash pattern if this is a component vector (dotted line)
    if (isDotted) {
        ctx.setLineDash([8, 5]); // Dotted line pattern for weight components
    } else {
        ctx.setLineDash([]);
    }
    
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrowhead
    const arrowSize = 12;
    const arrowAngle = Math.atan2(dy, dx);
    
    ctx.setLineDash([]); // Reset line dash for arrowhead
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle - Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle - Math.PI / 6)
    );
    ctx.lineTo(
        endX - arrowSize * Math.cos(arrowAngle + Math.PI / 6),
        endY - arrowSize * Math.sin(arrowAngle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
    
    // Draw label
    ctx.fillStyle = color;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const labelX = endX + 20 * Math.cos(arrowAngle);
    const labelY = endY + 20 * Math.sin(arrowAngle);
    
    // Draw label background
    const metrics = ctx.measureText(label);
    const labelWidth = metrics.width + 8;
    const labelHeight = 20;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(labelX - labelWidth/2, labelY - labelHeight/2, labelWidth, labelHeight);
    
    ctx.fillStyle = color;
    ctx.fillText(label, labelX, labelY);
    
    ctx.restore();
}

// Draw angle indicator at the base of the inclined plane
function drawAngleIndicator(x, y, angleRad) {
    ctx.save();
    
    const radius = 40;
    
    // Draw arc with correct angle direction for anti-clockwise rotation
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, angleRad, angleRad < 0);
    ctx.stroke();
    
    // Draw angle label
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const labelAngle = angleRad / 2;
    const labelX = x + (radius + 20) * Math.cos(labelAngle);
    const labelY = y + (radius + 20) * Math.sin(labelAngle);
    
    ctx.fillText('θ = ' + angle + '°', labelX, labelY);
    
    ctx.restore();
}

// Draw legend showing key information
function drawLegend() {
    ctx.save();
    
    const legendX = 10;
    const legendY = 10;
    const lineHeight = 22;
    
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillRect(legendX, legendY, 200, lineHeight * 2 + 10);
    
    // Draw text
    ctx.fillStyle = '#333333';
    ctx.fillText('As θ increases:', legendX + 5, legendY + 5);
    ctx.fillStyle = '#0000FF';
    ctx.fillText('• Normal Force (N) decreases', legendX + 5, legendY + 5 + lineHeight);
    
    ctx.restore();
}

// Handle mouse move for tooltips
function handleMouseMove(event) {
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    updateTooltip(x, y);
}

// Handle touch move for tooltips
function handleTouchMove(event) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    updateTooltip(x, y);
}

// Update tooltip position and content
function updateTooltip(x, y) {
    const tooltip = document.getElementById('tooltip');
    
    // Check if mouse is near the center (block area)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (distance < 80) {
        tooltip.textContent = `Forces on ${mass.toFixed(1)} kg block on ${angle}° incline. Normal force N = W cos θ = ${normalForce.toFixed(1)} N. As angle increases, normal force decreases.`;
        tooltip.style.left = centerX + 'px';
        tooltip.style.top = (centerY - 80) + 'px';
        tooltip.classList.add('show');
    } else {
        tooltip.classList.remove('show');
    }
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (animationFrame) {
        cancelAnimationFrame(animationFrame);
    }
});