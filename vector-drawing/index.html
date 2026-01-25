// Constants
const PIXELS_PER_CM = 40; // 1 cm = 40 pixels on screen
const GRID_SIZE = PIXELS_PER_CM;
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

// State
let scale = 1; // 1 cm = X units
let unit = 'm';
let currentProblemIndex = 0;
let currentStep = 0;
let vectors = []; // Array of drawn vectors
let isDrawing = false;
let startPoint = null;
let currentMousePos = { x: 0, y: 0 };
let currentTool = 'vector'; // 'vector' or 'pencil'
let pencilMarks = []; // Array of { path: [{x,y}, ...] }
let currentPencilPath = [];
let actionHistory = []; // Stack of actions: { type: 'vector' | 'pencil', index: number }

let draggableState = {
    activeElement: null, // 'protractor' or 'ruler'
    activePivot: null, // 1 or 2
    isDragging: false,
    isRotating: false,
    dragOffset: { x: 0, y: 0 },
    initialAngle: 0, // Angle between pivots at start
    items: {
        protractor: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2, rotation: 0, width: 400, height: 200 },
        ruler: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT * 0.7, rotation: 0, width: 600, height: 60 }
    }
};

// DOM Elements
const gridCanvas = document.getElementById('grid-canvas');
const drawingCanvas = document.getElementById('drawing-canvas');
const ctxGrid = gridCanvas.getContext('2d');
const ctxDraw = drawingCanvas.getContext('2d');
const problemText = document.getElementById('problem-text');
const problemNumberSpan = document.getElementById('problem-number');
const prevProbBtn = document.getElementById('prev-prob-btn');
const nextProbBtn = document.getElementById('next-prob-btn');
const scaleInput = document.getElementById('scale-input');
const setScaleBtn = document.getElementById('set-scale-btn');
const unitDisplay = document.getElementById('unit-display');
const guideStepDiv = document.getElementById('guide-step');
const prevStepBtn = document.getElementById('prev-step-btn');
const nextStepBtn = document.getElementById('next-step-btn');
const protractor = document.getElementById('protractor');
const ruler = document.getElementById('ruler');
const cursorInfo = document.getElementById('cursor-info');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const resetToolsBtn = document.getElementById('reset-tools-btn');
const canvasContainer = document.getElementById('canvas-container');
const togglePencilBtn = document.getElementById('toggle-pencil-btn');
const ansMagInput = document.getElementById('ans-mag');
const ansDirInput = document.getElementById('ans-dir');
const ansUnitSpan = document.getElementById('ans-unit');
const submitAnsBtn = document.getElementById('submit-ans-btn');
const answerFeedback = document.getElementById('answer-feedback');

// Problems
const problems = [
    {
        text: "A plane flies 50 km North, then 40 km on a bearing of 060°. Find the resultant displacement.",
        vectors: [
            { magnitude: 50, direction: 270 }, // North (270 degrees in canvas)
            { magnitude: 40, direction: 330 }  // Bearing 060 means 60 degrees clockwise from North. 270 + 60 = 330.
        ],
        unit: 'km'
    },
    {
        text: "A boat travels 100 m East, then 75 m South. Find the resultant displacement.",
        vectors: [
            { magnitude: 100, direction: 0 }, // East
            { magnitude: 75, direction: 90 }  // South
        ],
        unit: 'm'
    },
    {
        text: "A hiker walks 3 km on a bearing of 045°, then 2 km on a bearing of 135°. Find the resultant displacement.",
        vectors: [
            { magnitude: 3, direction: 315 }, // 045 bearing = 315 canvas (-45)
            { magnitude: 2, direction: 45 }   // 135 bearing = 45 canvas (90-45?) No. 
            // Bearing 0 is 270 (Up). 
            // Bearing 90 is 0 (Right).
            // Bearing 180 is 90 (Down).
            // Bearing 270 is 180 (Left).
            // Bearing = (Canvas - 270 + 360) % 360
            // Canvas = (Bearing + 270) % 360
            // 045 -> 45+270 = 315. Correct.
            // 135 -> 135+270 = 405 -> 45. Correct.
        ],
        unit: 'km'
    },
    {
        text: "A car drives 10 km West, then 5 km on a bearing of 200°. Find the resultant displacement.",
        vectors: [
            { magnitude: 10, direction: 180 }, // West
            { magnitude: 5, direction: 110 }   // 200 bearing -> 200+270 = 470 -> 110.
        ],
        unit: 'km'
    },
    {
        text: "A bird flies 20 m South, then 15 m on a bearing of 270° (West). Find the resultant displacement.",
        vectors: [
            { magnitude: 20, direction: 90 },  // South
            { magnitude: 15, direction: 180 }  // West (270 bearing -> 270+270 = 540 -> 180)
        ],
        unit: 'm'
    }
];

// Guide Steps
const guideSteps = [
    "Step 1: Read the problem. Identify the vectors given (magnitude and direction).",
    "Step 2: Choose a suitable scale. Enter it in the 'Scale' box above. (e.g. for 50km, maybe 1cm = 5km).",
    "Step 3: Draw the first vector (50 km North) starting from a convenient point (e.g. lower center).",
    "Step 4: Draw the second vector (40 km at 060°) starting from the HEAD of the first vector.",
    "Step 5: Draw the resultant vector from the START of the first vector to the END of the second vector.",
    "Step 6: Measure the length of the resultant vector and convert it back using your scale.",
    "Step 7: Use the protractor to measure the angle of the resultant vector."
];

// Initialization
function init() {
    // Set canvas size
    gridCanvas.width = CANVAS_WIDTH;
    gridCanvas.height = CANVAS_HEIGHT;
    drawingCanvas.width = CANVAS_WIDTH;
    drawingCanvas.height = CANVAS_HEIGHT;

    // Load first problem
    loadProblem(0);

    // Draw Grid
    drawGrid();

    // Event Listeners
    setupEventListeners();
    
    // Initialize Protractor Ticks (SVG)
    initProtractorTicks();
    
    // Initialize Ruler Ticks (SVG)
    initRulerTicks();
}

function initRulerTicks() {
    const ticksGroup = document.getElementById('ruler-ticks');
    // Clear existing
    while (ticksGroup.firstChild) {
        ticksGroup.removeChild(ticksGroup.firstChild);
    }
    
    const rulerWidth = 600;
    // Assume ruler represents 15 cm? No, grid is 40px/cm. 
    // 600px / 40 = 15 cm.
    
    for (let px = 0; px <= rulerWidth; px += 4) { // 4px = 1mm
        const isCm = px % 40 === 0;
        const isHalfCm = px % 20 === 0 && !isCm;
        
        let h = 10; // mm tick
        if (isCm) h = 25;
        else if (isHalfCm) h = 18;
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", px);
        line.setAttribute("y1", 0);
        line.setAttribute("x2", px);
        line.setAttribute("y2", h);
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", isCm ? "1.5" : "1");
        
        ticksGroup.appendChild(line);
        
        if (isCm) {
            const cmVal = px / 40;
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", px + 2);
            text.setAttribute("y", 40);
            text.setAttribute("font-family", "Arial");
            text.setAttribute("font-size", "12");
            text.textContent = cmVal;
            ticksGroup.appendChild(text);
        }
    }
}

function initProtractorTicks() {
    const ticksGroup = document.getElementById('ticks');
    const centerX = 200;
    const centerY = 200;
    const radius = 190;
    
    // Clear existing ticks if any (though usually empty on init)
    while (ticksGroup.firstChild) {
        ticksGroup.removeChild(ticksGroup.firstChild);
    }
    
    for (let i = 0; i <= 180; i++) {
        const rad = (i * Math.PI) / 180;
        
        // Determine tick length
        let tickLength = 5; // Default for 1 degree
        if (i % 5 === 0) tickLength = 10;
        if (i % 10 === 0) tickLength = 15;
        
        // Skip 0, 90, 180 if handled by static SVG, but adding ticks makes it consistent.
        // The static SVG has text for 0, 90, 180 but maybe not the rim ticks.
        // Let's add ticks for all.
        
        const x1 = centerX + radius * Math.cos(-rad);
        const y1 = centerY + radius * Math.sin(-rad);
        const x2 = centerX + (radius - tickLength) * Math.cos(-rad);
        const y2 = centerY + (radius - tickLength) * Math.sin(-rad);
        
        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        line.setAttribute("stroke", "black");
        line.setAttribute("stroke-width", i % 5 === 0 ? "1.5" : "0.5"); // Thicker for main ticks
        
        ticksGroup.appendChild(line);
        
        // Add text every 10 degrees
        if (i % 10 === 0) {
            // Skip 0, 90, 180 text as they might be in static SVG, or overwrite them.
            // Static SVG has 0, 90, 180. Let's check if we should duplicate.
            // Static SVG texts are at: 90->(195,30), 180->(10,190), 0->(370,190).
            // Our calculated text pos might differ. Let's just add them all for consistency and maybe remove static ones later if needed.
            // Actually, let's skip 0, 90, 180 text to avoid double rendering if they exist.
            if (i === 0 || i === 90 || i === 180) continue;

            const textRadius = radius - 25;
            const tx = centerX + textRadius * Math.cos(-rad);
            const ty = centerY + textRadius * Math.sin(-rad);
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", tx);
            text.setAttribute("y", ty);
            text.setAttribute("font-family", "Arial");
            text.setAttribute("font-size", "10");
            text.setAttribute("text-anchor", "middle");
            text.setAttribute("dominant-baseline", "middle");
            text.textContent = i;
            ticksGroup.appendChild(text);
        }
    }
}

function drawGrid() {
    ctxGrid.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctxGrid.strokeStyle = '#e0e0e0'; // Light grey
    ctxGrid.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
        ctxGrid.beginPath();
        ctxGrid.moveTo(x, 0);
        ctxGrid.lineTo(x, CANVAS_HEIGHT);
        ctxGrid.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
        ctxGrid.beginPath();
        ctxGrid.moveTo(0, y);
        ctxGrid.lineTo(CANVAS_WIDTH, y);
        ctxGrid.stroke();
    }
}

function setupEventListeners() {
    // Scale
    setScaleBtn.addEventListener('click', () => {
        const val = parseFloat(scaleInput.value);
        if (val > 0) {
            scale = val;
            alert(`Scale set: 1 cm = ${scale} ${unit}`);
        } else {
            alert("Please enter a valid positive number for scale.");
        }
    });

    // Guide
    prevStepBtn.addEventListener('click', () => updateStep(-1));
    nextStepBtn.addEventListener('click', () => updateStep(1));

    // Tool Switching
    togglePencilBtn.addEventListener('click', () => {
        if (currentTool === 'vector') {
            currentTool = 'pencil';
            togglePencilBtn.textContent = 'Pencil: On';
            togglePencilBtn.classList.add('active');
        } else {
            currentTool = 'vector';
            togglePencilBtn.textContent = 'Pencil: Off';
            togglePencilBtn.classList.remove('active');
        }
        updateDraggablesInteraction();
    });

    // Drawing Canvas Interactions
    drawingCanvas.addEventListener('mousedown', startDrawing);
    drawingCanvas.addEventListener('mousemove', draw);
    drawingCanvas.addEventListener('mouseup', stopDrawing);
    drawingCanvas.addEventListener('mouseout', stopDrawing);

    // Draggable Interactions (Protractor & Ruler)
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(el => {
        el.addEventListener('mousedown', startDragItem);
    });

    const pivots = document.querySelectorAll('.pivot');
    pivots.forEach(el => {
        el.addEventListener('mousedown', startRotateItem);
    });

    document.addEventListener('mousemove', moveItem);
    document.addEventListener('mouseup', stopDragItem);
    
    // Toolbar
    clearBtn.addEventListener('click', () => {
        vectors = [];
        pencilMarks = [];
        actionHistory = []; // Clear history on clear
        redrawVectors();
    });
    
    undoBtn.addEventListener('click', undoLastAction);
    
    submitAnsBtn.addEventListener('click', checkAnswer);
    
    resetToolsBtn.addEventListener('click', () => {
        resetDraggablePosition('protractor');
        resetDraggablePosition('ruler');
    });
    
    // Problem Navigation
    prevProbBtn.addEventListener('click', () => loadProblem(currentProblemIndex - 1));
    nextProbBtn.addEventListener('click', () => loadProblem(currentProblemIndex + 1));
}

function loadProblem(index) {
    if (index < 0 || index >= problems.length) return;
    
    currentProblemIndex = index;
    currentProblem = problems[index];
    
    // Update UI
    problemText.textContent = currentProblem.text;
    problemNumberSpan.textContent = `(${index + 1}/${problems.length})`;
    unitDisplay.textContent = currentProblem.unit;
    ansUnitSpan.textContent = currentProblem.unit;
    unit = currentProblem.unit;
    
    // Reset inputs
    ansMagInput.value = '';
    ansDirInput.value = '';
    answerFeedback.textContent = '';
    
    // Update navigation buttons
    prevProbBtn.disabled = index === 0;
    nextProbBtn.disabled = index === problems.length - 1;
    
    // Clear canvas
    vectors = [];
    pencilMarks = [];
    actionHistory = [];
    redrawVectors();
}

function updateDraggablesInteraction() {
    if (currentTool === 'pencil') {
        drawingCanvas.classList.add('on-top');
    } else {
        drawingCanvas.classList.remove('on-top');
    }
}

function resetDraggablePosition(type) {
    const el = document.getElementById(type);
    const state = draggableState.items[type];
    
    // Reset state values
    if (type === 'protractor') {
        state.x = CANVAS_WIDTH / 2;
        state.y = CANVAS_HEIGHT / 2;
    } else if (type === 'ruler') {
        state.x = CANVAS_WIDTH / 2;
        state.y = CANVAS_HEIGHT * 0.7;
    }
    state.rotation = 0;
    
    // Apply styles
    el.style.left = '50%';
    el.style.top = type === 'protractor' ? '50%' : '70%';
    el.style.transform = `translate(-50%, -50%) rotate(0deg)`;
}

function checkAnswer() {
    const userMag = parseFloat(ansMagInput.value);
    const userDir = parseFloat(ansDirInput.value);
    
    if (isNaN(userMag) || isNaN(userDir)) {
        answerFeedback.textContent = "Please enter both magnitude and direction.";
        answerFeedback.style.color = "red";
        return;
    }
    
    // Calculate correct answer
    // Vectors in problem are defined with magnitude and canvas direction (degrees clockwise from +x axis? No, earlier comments said 270 is North (Up -y)).
    // Let's stick to standard math coordinates for calculation and convert.
    // Standard Math: 0 is East (+x), 90 is North (+y).
    // Canvas: 0 is Right (+x), 90 is Down (+y).
    // To convert Canvas Angle to Math Angle (standard):
    // MathAngle = -CanvasAngle (flipped y)
    // Wait, let's just resolve components in Canvas space (x right, y down).
    
    let totalRx = 0;
    let totalRy = 0;
    
    currentProblem.vectors.forEach(v => {
        // v.direction is in degrees, Canvas convention (0 Right, 90 Down)
        const rad = v.direction * Math.PI / 180;
        const dx = v.magnitude * Math.cos(rad);
        const dy = v.magnitude * Math.sin(rad);
        totalRx += dx;
        totalRy += dy;
    });
    
    const resultantMag = Math.sqrt(totalRx * totalRx + totalRy * totalRy);
    
    // Resultant Angle in Canvas
    let resultantAngleRad = Math.atan2(totalRy, totalRx);
    let resultantAngleDeg = resultantAngleRad * 180 / Math.PI;
    if (resultantAngleDeg < 0) resultantAngleDeg += 360;
    
    // Convert Canvas Angle to Bearing
    // Canvas: 0 (East), 90 (South), 180 (West), 270 (North).
    // Bearing: 0 (North), 90 (East), 180 (South), 270 (West).
    // Relation:
    // If C=270, B=0.
    // If C=0, B=90.
    // If C=90, B=180.
    // B = (C - 270 + 360) % 360 ? No. 
    // Let's test: C=0 -> 0-270 = -270 -> +360 = 90. Correct.
    // C=90 -> 90-270 = -180 -> +360 = 180. Correct.
    // C=270 -> 0. Correct.
    // C=330 (30 deg North of East) -> 330-270=60. Correct.
    // So formula: Bearing = (CanvasAngle - 270 + 360) % 360.
    
    const correctBearing = (resultantAngleDeg - 270 + 360) % 360;
    
    // Compare
    const magDiff = Math.abs(userMag - resultantMag);
    const magErrorPercent = (magDiff / resultantMag) * 100;
    
    // Angle diff handling 360 wrap
    let dirDiff = Math.abs(userDir - correctBearing);
    if (dirDiff > 180) dirDiff = 360 - dirDiff;
    
    let feedback = "";
    let isClose = true;
    
    // Tolerances: 5% magnitude, 5 degrees direction
    if (magErrorPercent > 5) {
        feedback += `Magnitude is off. Correct: ~${resultantMag.toFixed(1)} ${unit}. `;
        isClose = false;
    } else {
        feedback += `Magnitude is correct! (Exact: ${resultantMag.toFixed(1)} ${unit}) `;
    }
    
    if (dirDiff > 5) {
        feedback += `Direction is off. Correct: ~${correctBearing.toFixed(1)}°.`;
        isClose = false;
    } else {
        feedback += `Direction is correct! (Exact: ${correctBearing.toFixed(1)}°)`;
    }
    
    answerFeedback.textContent = feedback;
    answerFeedback.style.color = isClose ? "green" : "red";
}

function updateStep(change) {
    currentStep += change;
    if (currentStep < 0) currentStep = 0;
    if (currentStep >= guideSteps.length) currentStep = guideSteps.length - 1;

    guideStepDiv.textContent = guideSteps[currentStep];
    prevStepBtn.disabled = currentStep === 0;
    nextStepBtn.disabled = currentStep === guideSteps.length - 1;
}

// Drawing Logic
function getMousePos(evt) {
    const rect = drawingCanvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

function startDrawing(evt) {
    // Only draw if left click and not interacting with draggable items
    isDrawing = true;
    const pos = getMousePos(evt);
    
    if (currentTool === 'vector') {
        // Snap to grid? Maybe optional. Let's snap to nearest 5 pixels for easier alignment
        startPoint = {
            x: Math.round(pos.x / 5) * 5,
            y: Math.round(pos.y / 5) * 5
        };
        currentMousePos = startPoint;
    } else if (currentTool === 'pencil') {
        startPoint = pos; // No snapping for pencil
        currentPencilPath = [pos];
    }
}

function draw(evt) {
    if (!isDrawing) return;

    const pos = getMousePos(evt);
    
    // Update coordinates display
    cursorInfo.textContent = `Pos: (${Math.round(pos.x)}, ${Math.round(pos.y)})`;

    if (currentTool === 'vector') {
        currentMousePos = {
            x: Math.round(pos.x / 5) * 5,
            y: Math.round(pos.y / 5) * 5
        };

        // Clear and redraw everything
        redrawVectors();

        // Draw current line being dragged
        ctxDraw.beginPath();
        ctxDraw.moveTo(startPoint.x, startPoint.y);
        ctxDraw.lineTo(currentMousePos.x, currentMousePos.y);
        ctxDraw.strokeStyle = 'blue';
        ctxDraw.lineWidth = 2;
        ctxDraw.stroke();
        
        // Draw arrow head
        drawArrowHead(ctxDraw, startPoint, currentMousePos, 'blue');
        
        // Display length - DISABLED per user request
        /*
        const dx = currentMousePos.x - startPoint.x;
        const dy = currentMousePos.y - startPoint.y; // Positive y is down
        const distPixels = Math.sqrt(dx*dx + dy*dy);
        const distCm = distPixels / PIXELS_PER_CM;
        const realDist = distCm * scale;
        
        ctxDraw.font = "12px Arial";
        ctxDraw.fillStyle = "black";
        ctxDraw.fillText(`${realDist.toFixed(1)} ${unit}`, (startPoint.x + currentMousePos.x)/2 + 10, (startPoint.y + currentMousePos.y)/2);
        */
        
    } else if (currentTool === 'pencil') {
        currentPencilPath.push(pos);
        
        // Redraw to show current stroke + existing
        redrawVectors();
        
        // Draw current stroke
        ctxDraw.beginPath();
        if (currentPencilPath.length > 0) {
            ctxDraw.moveTo(currentPencilPath[0].x, currentPencilPath[0].y);
            for (let i = 1; i < currentPencilPath.length; i++) {
                ctxDraw.lineTo(currentPencilPath[i].x, currentPencilPath[i].y);
            }
        }
        ctxDraw.strokeStyle = 'grey';
        ctxDraw.lineWidth = 1;
        ctxDraw.stroke();
    }
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    
    if (currentTool === 'vector') {
        // Save the vector
        if (startPoint.x !== currentMousePos.x || startPoint.y !== currentMousePos.y) {
            vectors.push({
                start: startPoint,
                end: currentMousePos
            });
            actionHistory.push({ type: 'vector' });
        }
    } else if (currentTool === 'pencil') {
        if (currentPencilPath.length > 1) {
            pencilMarks.push(currentPencilPath);
            actionHistory.push({ type: 'pencil' });
        }
        currentPencilPath = [];
    }
    redrawVectors();
}

function undoLastAction() {
    if (actionHistory.length === 0) return;
    
    const lastAction = actionHistory.pop();
    
    if (lastAction.type === 'vector') {
        vectors.pop();
    } else if (lastAction.type === 'pencil') {
        pencilMarks.pop();
    }
    
    redrawVectors();
}

function redrawVectors() {
    ctxDraw.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Draw Pencil Marks first (so vectors are on top)
    ctxDraw.strokeStyle = 'grey';
    ctxDraw.lineWidth = 1;
    pencilMarks.forEach(path => {
        if (path.length < 2) return;
        ctxDraw.beginPath();
        ctxDraw.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) {
            ctxDraw.lineTo(path[i].x, path[i].y);
        }
        ctxDraw.stroke();
    });

    // Draw Vectors
    vectors.forEach(v => {
        ctxDraw.beginPath();
        ctxDraw.moveTo(v.start.x, v.start.y);
        ctxDraw.lineTo(v.end.x, v.end.y);
        ctxDraw.strokeStyle = 'black';
        ctxDraw.lineWidth = 2;
        ctxDraw.stroke();
        drawArrowHead(ctxDraw, v.start, v.end, 'black');
        
        // Label - DISABLED per user request
        /*
        const dx = v.end.x - v.start.x;
        const dy = v.end.y - v.start.y;
        const distPixels = Math.sqrt(dx*dx + dy*dy);
        const distCm = distPixels / PIXELS_PER_CM;
        const realDist = distCm * scale;
        ctxDraw.fillStyle = "black";
        ctxDraw.fillText(`${realDist.toFixed(1)} ${unit}`, (v.start.x + v.end.x)/2 + 10, (v.start.y + v.end.y)/2);
        */
    });
}

function drawArrowHead(ctx, from, to, color) {
    const headLength = 10;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLength * Math.cos(angle - Math.PI / 6), to.y - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLength * Math.cos(angle + Math.PI / 6), to.y - headLength * Math.sin(angle + Math.PI / 6));
    ctx.lineTo(to.x, to.y);
    ctx.fillStyle = color;
    ctx.fill();
}

// Draggable Items Logic (Protractor & Ruler)
function startDragItem(evt) {
    if (evt.target.classList.contains('pivot')) return; // Let pivot handler handle it
    
    // Determine which element is being dragged
    const target = evt.currentTarget;
    const type = target.dataset.type; // 'protractor' or 'ruler'
    
    draggableState.activeElement = type;
    draggableState.isDragging = true;
    
    // Calculate drag offset relative to the element's center
    // But since element is rotated, standard bounding rect logic is tricky.
    // Simpler approach: We track center in draggableState.
    // Offset = MousePos - CenterPos
    
    const state = draggableState.items[type];
    const rect = canvasContainer.getBoundingClientRect();
    const mouseX = evt.clientX - rect.left;
    const mouseY = evt.clientY - rect.top;
    
    draggableState.dragOffset.x = mouseX - state.x;
    draggableState.dragOffset.y = mouseY - state.y;
    
    target.style.cursor = 'grabbing';
}

function startRotateItem(evt) {
    evt.stopPropagation(); // Prevent drag start
    
    const target = evt.currentTarget.closest('.draggable');
    const type = target.dataset.type;
    const pivotId = parseInt(evt.currentTarget.dataset.id); // 1 or 2
    
    draggableState.activeElement = type;
    draggableState.activePivot = pivotId;
    draggableState.isRotating = true;
}

function getPivotLocalPos(type, pivotId) {
    // Return local coordinates (relative to center) of the pivots
    if (type === 'ruler') {
        // Ruler: 600x60. Center (0,0) local.
        // Pivot 1: Left (20, 30) from top-left. Relative to center (300, 30):
        // x = 20 - 300 = -280
        // y = 30 - 30 = 0
        // Pivot 2: Right (580, 30).
        // x = 580 - 300 = 280
        // y = 0
        if (pivotId === 1) return { x: -280, y: 0 };
        if (pivotId === 2) return { x: 280, y: 0 };
    } else if (type === 'protractor') {
        // Protractor: 400x200. Center (0,0) local. (Center of bounding box is (200, 100))
        // Pivot 1: Origin (200, 200). Relative to center (200, 100):
        // x = 200 - 200 = 0
        // y = 200 - 100 = 100
        // Pivot 2: Right Edge (380, 200).
        // x = 380 - 200 = 180
        // y = 200 - 100 = 100
        if (pivotId === 1) return { x: 0, y: 100 };
        if (pivotId === 2) return { x: 180, y: 100 };
    }
    return { x: 0, y: 0 };
}

function moveItem(evt) {
    const rect = canvasContainer.getBoundingClientRect();
    const mouseX = evt.clientX - rect.left;
    const mouseY = evt.clientY - rect.top;

    if (draggableState.isDragging && draggableState.activeElement) {
        const type = draggableState.activeElement;
        const el = document.getElementById(type);
        
        let newX = mouseX - draggableState.dragOffset.x;
        let newY = mouseY - draggableState.dragOffset.y;
        
        // Update State
        draggableState.items[type].x = newX;
        draggableState.items[type].y = newY;
        
        // Remove previous boundary constraints as per user request
        
        updateElementTransform(type);
        updatePivotVisuals(type); // New: Shift pivots to stay on screen
    }
    
    if (draggableState.isRotating && draggableState.activeElement) {
        const type = draggableState.activeElement;
        const activePivotId = draggableState.activePivot;
        const otherPivotId = activePivotId === 1 ? 2 : 1;
        
        const state = draggableState.items[type];
        
        // 1. Get Local Pos of both pivots
        // Important: Use the STATIC local pos for rotation calculations
        // The visual shift should not affect the center of rotation logic if we are consistent.
        // Wait, if pivot 2 shifted, and we rotate around it, the rotation center IS shifted.
        // So we need to use the CURRENT visual local pos?
        // Or does "shift the pivot" mean the pivot *handle* moves, but the underlying definition of the tool stays?
        // If I move the handle, the handle is the new anchor.
        // So yes, we need the *current* local pos of the pivots.
        // Let's store current local pos in state or read it from DOM (style)?
        // Storing in state is cleaner.
        // draggableState.items[type].pivots = { 1: {x,y}, 2: {x,y} }
        // Let's initialize this state.
        
        if (!state.pivots) {
            // Initialize if missing (should be done in init, but lazy load here works)
            state.pivots = {
                1: getOriginalPivotLocalPos(type, 1),
                2: getOriginalPivotLocalPos(type, 2)
            };
        }
        
        const activeLocal = state.pivots[activePivotId];
        const otherLocal = state.pivots[otherPivotId];
        
        // ... rest of rotation logic ...
        
        // 2. Calculate World Pos of the "Other Pivot" (the anchor)
        const rad = state.rotation * Math.PI / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const otherWorldX = state.x + (otherLocal.x * cos - otherLocal.y * sin);
        const otherWorldY = state.y + (otherLocal.x * sin + otherLocal.y * cos);
        
        // 3. New Angle
        const dx = mouseX - otherWorldX;
        const dy = mouseY - otherWorldY;
        const newAngleRad = Math.atan2(dy, dx);
        
        // Vector from Anchor(Other) to Active(Local) in unrotated space?
        // No, the angle of the tool depends on the line between the two pivots.
        // Base Angle is angle of (Active - Other) in Local space.
        const dxLocal = activeLocal.x - otherLocal.x;
        const dyLocal = activeLocal.y - otherLocal.y;
        const baseAngleRad = Math.atan2(dyLocal, dxLocal);
        
        // The rotation needed is (New Angle - Base Angle)
        let newRotation = (newAngleRad - baseAngleRad) * 180 / Math.PI;
        state.rotation = newRotation;
        
        // 4. New Center
        const newRad = newRotation * Math.PI / 180;
        const newCos = Math.cos(newRad);
        const newSin = Math.sin(newRad);
        
        const offsetX = otherLocal.x * newCos - otherLocal.y * newSin;
        const offsetY = otherLocal.x * newSin + otherLocal.y * newCos;
        
        state.x = otherWorldX - offsetX;
        state.y = otherWorldY - offsetY;
        
        updateElementTransform(type);
        updatePivotVisuals(type); // Update pivots after rotation too
    }
}

function getOriginalPivotLocalPos(type, pivotId) {
     // Return original local coordinates (relative to center) of the pivots
     if (type === 'ruler') {
         if (pivotId === 1) return { x: -280, y: 0 };
         if (pivotId === 2) return { x: 280, y: 0 };
     } else if (type === 'protractor') {
         if (pivotId === 1) return { x: 0, y: 100 };
         if (pivotId === 2) return { x: 180, y: 100 };
     }
     return { x: 0, y: 0 };
}

// Helper to project point p onto line segment ab
function closestPointOnSegment(p, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lenSq = abx*abx + aby*aby;
    if (lenSq === 0) return a;
    
    const apx = p.x - a.x;
    const apy = p.y - a.y;
    const t = Math.max(0, Math.min(1, (apx*abx + apy*aby) / lenSq));
    
    return {
        x: a.x + t*abx,
        y: a.y + t*aby
    };
}

function updatePivotVisuals(type) {
    const state = draggableState.items[type];
    
    // Initialize pivot state if needed
    if (!state.pivots) {
        state.pivots = {
            1: getOriginalPivotLocalPos(type, 1),
            2: getOriginalPivotLocalPos(type, 2)
        };
    }
    
    // Define the "Axis" or "Safe Zone" for pivots in Local Space
    // Ruler: y=0, x from -280 to 280.
    // Protractor: y=100, x from 0 to 180? (Base line).
    // Actually, allowing pivots to slide along the base line is what we want.
    
    let lineStart, lineEnd;
    if (type === 'ruler') {
        lineStart = { x: -280, y: 0 };
        lineEnd = { x: 280, y: 0 };
    } else {
        // Protractor
        lineStart = { x: 0, y: 100 };
        lineEnd = { x: 180, y: 100 };
    }
    
    // Calculate World Pos of Line Segment
    const rad = state.rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    function localToWorld(p) {
        return {
            x: state.x + (p.x * cos - p.y * sin),
            y: state.y + (p.x * sin + p.y * cos)
        };
    }
    
    const pStartWorld = localToWorld(lineStart);
    const pEndWorld = localToWorld(lineEnd);
    
    // Clip this segment to Canvas Rect (0,0, W,H)
    // Cohen-Sutherland or similar.
    // Let's use a simpler parametric check since we just need the visible subset of the line.
    // P(t) = PStart + t * (PEnd - PStart), t in [0, 1]
    
    let tMin = 0;
    let tMax = 1;
    
    const dx = pEndWorld.x - pStartWorld.x;
    const dy = pEndWorld.y - pStartWorld.y;
    
    const p = [-dx, dx, -dy, dy];
    const q = [pStartWorld.x, CANVAS_WIDTH - pStartWorld.x, pStartWorld.y, CANVAS_HEIGHT - pStartWorld.y];
    
    for (let i = 0; i < 4; i++) {
        if (p[i] === 0) {
            if (q[i] < 0) {
                // Parallel and outside
                tMin = 0; tMax = -1; // Invalid
            }
        } else {
            const t = q[i] / p[i];
            if (p[i] < 0) {
                if (t > tMin) tMin = t;
            } else {
                if (t < tMax) tMax = t;
            }
        }
    }
    
    if (tMin > tMax) {
        // Line is completely outside canvas.
        // We still want to show pivots, so user can drag it back!
        // Strategy: Project the center of canvas (or closest canvas point) onto the line?
        // Or just clamp the pivots to the "nearest" end of the line.
        // Let's default to original positions if invisible?
        // No, if invisible, we can't see them.
        // Maybe we don't support sliding if it's completely out?
        // But user said "shift pivot... do not limit tool".
        // This implies tool can be out, but pivot must be in.
        // If the line doesn't intersect canvas, we can't place a pivot on the line AND in the canvas.
        // UNLESS we extend the line infinitely? But pivots must be ON the tool.
        // If the tool is completely out, we can't satisfy "pivot on tool" AND "pivot in canvas".
        // So we just keep them at ends (and they will be off screen).
        // BUT, if the tool crosses the canvas, we clamp.
        
        // Reset to ends
        state.pivots[1] = lineStart;
        state.pivots[2] = lineEnd;
    } else {
        // Valid intersection range [tMin, tMax]
        // We want pivots to be as far apart as possible within this range?
        // Or should they stick to their original relative positions if possible?
        // The user said "shift pivot...".
        // Let's assume Pivot 1 prefers 0 (Start) and Pivot 2 prefers 1 (End).
        // So we clamp Pivot 1 to tMin, and Pivot 2 to tMax.
        // Wait, if tMin > 0, it means the start is cut off. So Pivot 1 should slide to tMin.
        // If tMax < 1, it means the end is cut off. So Pivot 2 should slide to tMax.
        
        const newP1Local = {
            x: lineStart.x + tMin * (lineEnd.x - lineStart.x),
            y: lineStart.y + tMin * (lineEnd.y - lineStart.y)
        };
        
        const newP2Local = {
            x: lineStart.x + tMax * (lineEnd.x - lineStart.x),
            y: lineStart.y + tMax * (lineEnd.y - lineStart.y)
        };
        
        state.pivots[1] = newP1Local;
        state.pivots[2] = newP2Local;
    }
    
    // Apply visual update (update DOM positions of pivot divs)
    // Pivot divs are absolute children of the tool.
    // Tool is rotated.
    // Left/Top of pivot should be relative to tool center (since tool uses transform translate -50 -50).
    // Actually, tool uses `left: state.x, top: state.y` and `transform: translate(-50%, -50%)`.
    // So the origin (0,0) of the div is the top-left corner of the unrotated box.
    // Center of box is (W/2, H/2).
    // Local coords (relative to center) (x,y) -> Div coords (W/2+x, H/2+y).
    
    const el = document.getElementById(type);
    const p1Div = el.querySelector('.pivot-1');
    const p2Div = el.querySelector('.pivot-2');
    
    const w = state.width;
    const h = state.height;
    
    p1Div.style.left = `${w/2 + state.pivots[1].x}px`;
    p1Div.style.top = `${h/2 + state.pivots[1].y}px`;
    p1Div.style.transform = 'translate(-50%, -50%)'; // Pivot centered on point
    
    p2Div.style.left = `${w/2 + state.pivots[2].x}px`;
    p2Div.style.top = `${h/2 + state.pivots[2].y}px`;
    p2Div.style.transform = 'translate(-50%, -50%)';
}

function updateElementTransform(type) {
    const el = document.getElementById(type);
    const state = draggableState.items[type];
    el.style.left = `${state.x}px`;
    el.style.top = `${state.y}px`;
    el.style.transform = `translate(-50%, -50%) rotate(${state.rotation}deg)`;
}

function stopDragItem() {
    draggableState.isDragging = false;
    draggableState.isRotating = false;
    if (draggableState.activeElement) {
        document.getElementById(draggableState.activeElement).style.cursor = 'move';
    }
    draggableState.activeElement = null;
    draggableState.activePivot = null;
}

// Start
init();
