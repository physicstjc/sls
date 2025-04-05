class ProjectileSimulation {
    constructor() {
        this.initializeCanvas();
        this.initializePhysics();
        this.setupEventListeners();
        this.drawGround();
    }

    initializeCanvas() {
        this.simCanvas = document.getElementById('simulationCanvas');
        this.graphCanvas = document.getElementById('velocityGraph');
        this.simCtx = this.simCanvas.getContext('2d');
        this.graphCtx = this.graphCanvas.getContext('2d');
        
        this.resizeCanvases();
        window.addEventListener('resize', () => this.resizeCanvases());
    }

    initializePhysics() {
        this.g = 9.81;  // Gravity (m/s²)
        this.k = 0.03;  // Air resistance coefficient
        this.scale = 10; // Pixels per meter
        this.isSimulating = false;
        this.hasAirResistance = false;  // Air resistance toggle
        this.isPaused = false;
        this.totalTime = 0;
        this.timeSlider = document.getElementById('timeSlider');
    }

    setupEventListeners() {
        document.getElementById('pausePlay').addEventListener('click', () => {
            if (!this.isSimulating || this.isPaused) {
                this.time = 0;
                this.timeSlider.value = 0;
                document.getElementById('timeValue').textContent = '0.00s';
                this.startSimulation();
            } else {
                this.isPaused = !this.isPaused;
                document.getElementById('pausePlay').textContent = this.isPaused ? 'Play' : 'Pause';
            }
        });
        
        document.getElementById('velocity').addEventListener('input', (e) => {
            document.getElementById('velocityValue').textContent = e.target.value;
            this.drawPreview();
        });
        document.getElementById('angle').addEventListener('input', (e) => {
            document.getElementById('angleValue').textContent = e.target.value;
            this.drawPreview();
        });
        document.getElementById('airResistance').addEventListener('change', (e) => {
            this.hasAirResistance = e.target.checked;
            this.drawPreview();
        });

        document.getElementById('restart').addEventListener('click', () => this.restartSimulation());
        
        this.timeSlider.addEventListener('input', (e) => {
            if (this.isSimulating) {
                this.time = (parseFloat(e.target.value) / 100) * this.totalTime;
                this.updateSimulationState();
            }
        });
    }

    resizeCanvases() {
        this.simCanvas.width = this.simCanvas.clientWidth;
        this.simCanvas.height = this.simCanvas.clientHeight;
        this.graphCanvas.width = this.graphCanvas.clientWidth;
        this.graphCanvas.height = this.graphCanvas.clientHeight;
        this.drawGround();
    }

    startSimulation() {
        if (this.isSimulating) {
            cancelAnimationFrame(this.animationFrame);
        }

        // Clear previous data
        this.graphCtx.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
        this.drawGraphAxes();

        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;

        this.maxHeight = 0;  // Initialize maxHeight
        this.position = { x: 50, y: this.simCanvas.height - 50 };
        this.velocity = {
            x: velocity * Math.cos(angle),
            y: velocity * Math.sin(angle)
        };
        this.time = 0;
        this.dataPoints = [{
            time: 0,
            vx: velocity * Math.cos(angle),
            vy: velocity * Math.sin(angle)  // Initial vertical velocity is positive upward
        }];
        this.isSimulating = true;
        this.totalTime = this.calculateTotalTime();
        this.isPaused = false;
        
        this.animate();
    }

    drawPreview() {
        this.simCtx.clearRect(0, 0, this.simCanvas.width, this.simCanvas.height);
        this.drawGround();

        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;
        
        // Calculate values without air resistance
        const v0y = velocity * Math.sin(angle);
        const v0x = velocity * Math.cos(angle);
        const idealMaxHeight = (v0y * v0y) / (2 * this.g);
        const timeOfFlight = (2 * v0y) / this.g;
        const idealRange = v0x * timeOfFlight;

        // Draw trajectory and calculate values with air resistance
        let x = 50;
        let y = this.simCanvas.height - 50;
        let vx = velocity * Math.cos(angle);
        let vy = velocity * Math.sin(angle);
        let maxHeight = 0;

        this.simCtx.beginPath();
        this.simCtx.setLineDash([5, 5]);
        this.simCtx.moveTo(x, y);

        while (y <= this.simCanvas.height - 50) {
            if (this.hasAirResistance) {
                const speed = Math.sqrt(vx * vx + vy * vy);
                vx += -this.k * speed * vx * 0.016;
                vy += (-this.g - this.k * speed * vy) * 0.016;
            } else {
                vy += -this.g * 0.016;
            }

            x += vx * 0.016 * this.scale;
            y += -vy * 0.016 * this.scale;

            const currentHeight = (this.simCanvas.height - 50 - y) / this.scale;
            maxHeight = Math.max(maxHeight, currentHeight);

            if (y <= this.simCanvas.height - 50) {
                this.simCtx.lineTo(x, y);
            }
        }

        this.simCtx.stroke();
        this.simCtx.setLineDash([]);

        // Display both ideal and air resistance values
        document.getElementById('maxHeight').textContent = 
            `${idealMaxHeight.toFixed(2)} m (ideal) | ${maxHeight.toFixed(2)} m (with air)`;
        document.getElementById('range').textContent = 
            `${idealRange.toFixed(2)} m (ideal) | ${((x - 50) / this.scale).toFixed(2)} m (with air)`;
    }

    updateTrajectoryInfo(velocity, angle) {
        if (!this.hasAirResistance) {
            const v0y = velocity * Math.sin(angle);
            const v0x = velocity * Math.cos(angle);
            const maxHeight = (v0y * v0y) / (2 * this.g);
            const timeOfFlight = (2 * v0y) / this.g;
            const range = v0x * timeOfFlight;

            document.getElementById('maxHeight').textContent = maxHeight.toFixed(2);
            document.getElementById('range').textContent = range.toFixed(2);
        } else {
            // For air resistance case, values are calculated in drawPreview
        }
    }

    drawVelocityVectors() {
        const THRESHOLD = 1.0; // Increased threshold to better detect near-zero velocities

        // Draw x velocity vector (blue) only if significant
        if (Math.abs(this.velocity.x) > THRESHOLD) {
            this.drawArrow(
                this.position.x, 
                this.position.y, 
                this.position.x + this.velocity.x * 5, 
                this.position.y, 
                'blue'
            );
        }

        // Draw y velocity vector (green) only if significant
        if (Math.abs(this.velocity.y) > THRESHOLD) {
            this.drawArrow(
                this.position.x, 
                this.position.y, 
                this.position.x, 
                this.position.y - this.velocity.y * 5,  // Negative for upward display
                'green'
            );
        }
    }

    drawArrow(fromX, fromY, toX, toY, color) {
        const headLength = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        const velocity = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);

        // Draw the line
        this.simCtx.beginPath();
        this.simCtx.moveTo(fromX, fromY);
        this.simCtx.lineTo(toX, toY);
        this.simCtx.strokeStyle = color;
        this.simCtx.stroke();

        // Only draw arrowhead if velocity component is significant
        if (velocity > 1) {
            this.simCtx.beginPath();
            this.simCtx.moveTo(toX, toY);
            this.simCtx.lineTo(
                toX - headLength * Math.cos(angle - Math.PI/6),
                toY - headLength * Math.sin(angle - Math.PI/6)
            );
            this.simCtx.lineTo(
                toX - headLength * Math.cos(angle + Math.PI/6),
                toY - headLength * Math.sin(angle + Math.PI/6)
            );
            this.simCtx.lineTo(toX, toY);
            this.simCtx.fillStyle = color;
            this.simCtx.fill();
        }
    }

    updateGraph() {
        // Store actual velocity magnitudes
        this.dataPoints.push({
            time: this.time,
            vx: Math.abs(this.velocity.x),  // Magnitude of horizontal velocity
            vy: Math.abs(this.velocity.y)    // Magnitude of vertical velocity
        });

        this.graphCtx.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
        this.drawGraphAxes();
        this.plotVelocityComponent(this.dataPoints.map(p => p.vx), 'blue');
        this.plotVelocityComponent(this.dataPoints.map(p => p.vy), 'green');
    }

    startSimulation() {
        if (this.isSimulating) {
            cancelAnimationFrame(this.animationFrame);
        }

        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;

        this.position = { x: 50, y: this.simCanvas.height - 50 };
        this.velocity = {
            x: velocity * Math.cos(angle),
            y: velocity * Math.sin(angle)
        };
        this.time = 0;
        this.dataPoints = [{
            time: 0,
            vx: velocity * Math.cos(angle),
            vy: velocity * Math.sin(angle)  // Initial vertical velocity is positive upward
        }];
        this.isSimulating = true;
        this.totalTime = this.calculateTotalTime();
        this.isPaused = false;
        
        this.animate();
    }

    drawPreview() {
        this.simCtx.clearRect(0, 0, this.simCanvas.width, this.simCanvas.height);
        this.drawGround();

        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;
        
        let x = 50;
        let y = this.simCanvas.height - 50;
        let vx = velocity * Math.cos(angle);
        let vy = velocity * Math.sin(angle);

        this.simCtx.beginPath();
        this.simCtx.setLineDash([5, 5]);
        this.simCtx.moveTo(x, y);

        for (let t = 0; t < 5; t += 0.016) {
            if (y > this.simCanvas.height - 50) break;

            if (this.hasAirResistance) {
                const speed = Math.sqrt(vx * vx + vy * vy);
                vx += -this.k * speed * vx * 0.016;  // Fixed: was using 'vs' instead of 'speed'
                vy += (-this.g - this.k * speed * vy) * 0.016;
            } else {
                vy += -this.g * 0.016;
            }

            x += vx * 0.016 * this.scale;
            y += -vy * 0.016 * this.scale;  // Negative for canvas coordinates

            this.simCtx.lineTo(x, y);
        }

        this.simCtx.stroke();
        this.simCtx.setLineDash([]);

        this.updateTrajectoryInfo(velocity, angle);
    }

    updateTrajectoryInfo(velocity, angle) {
        if (!this.hasAirResistance) {
            const v0y = velocity * Math.sin(angle);
            const v0x = velocity * Math.cos(angle);
            const maxHeight = (v0y * v0y) / (2 * this.g);
            const timeOfFlight = (2 * v0y) / this.g;  // Time to reach ground
            const range = v0x * timeOfFlight;  // Range = horizontal velocity * time

            document.getElementById('maxHeight').textContent = maxHeight.toFixed(2);
            document.getElementById('range').textContent = range.toFixed(2);
        } else {
            // For air resistance case, values are calculated in drawPreview
        }
    }

    drawVelocityVectors() {
        // Draw x velocity vector (blue)
        this.drawArrow(
            this.position.x, 
            this.position.y, 
            this.position.x + this.velocity.x * 5, 
            this.position.y, 
            'blue'
        );

        // Draw y velocity vector (green)
        this.drawArrow(
            this.position.x, 
            this.position.y, 
            this.position.x, 
            this.position.y - this.velocity.y * 5,  // Negative for upward display
            'green'
        );
    }

    drawArrow(fromX, fromY, toX, toY, color) {
        const headLength = 10;
        const angle = Math.atan2(toY - fromY, toX - fromX);

        // Draw the line
        this.simCtx.beginPath();
        this.simCtx.moveTo(fromX, fromY);
        this.simCtx.lineTo(toX, toY);
        this.simCtx.strokeStyle = color;
        this.simCtx.stroke();

        // Draw the arrow head
        this.simCtx.beginPath();
        this.simCtx.moveTo(toX, toY);
        this.simCtx.lineTo(
            toX - headLength * Math.cos(angle - Math.PI/6),
            toY - headLength * Math.sin(angle - Math.PI/6)
        );
        this.simCtx.lineTo(
            toX - headLength * Math.cos(angle + Math.PI/6),
            toY - headLength * Math.sin(angle + Math.PI/6)
        );
        this.simCtx.lineTo(toX, toY);
        this.simCtx.fillStyle = color;
        this.simCtx.fill();
    }

    updateGraph() {
        this.dataPoints.push({
            time: this.time,
            vx: this.velocity.x,
            vy: this.velocity.y  // Store actual velocity values
        });

        this.graphCtx.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
        this.drawGraphAxes();
        this.plotVelocityComponent(this.dataPoints.map(p => p.vx), 'blue');
        this.plotVelocityComponent(this.dataPoints.map(p => p.vy), 'green');
    }

    animate() {
        if (!this.isPaused) {
            this.simCtx.clearRect(0, 0, this.simCanvas.width, this.simCanvas.height);
            this.drawGround();
            
            // Draw the preview path first
            this.drawPreview();

            // Draw the projectile and vectors
            this.simCtx.beginPath();
            this.simCtx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2);
            this.simCtx.fillStyle = 'red';
            this.simCtx.fill();

            const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            
            if (this.hasAirResistance) {
                this.velocity.x += -this.k * speed * this.velocity.x * 0.016;
                this.velocity.y += (-this.g - this.k * speed * this.velocity.y) * 0.016;
            } else {
                this.velocity.y += -this.g * 0.016;  // Gravity decreases vy
            }

            // Convert velocities to canvas coordinates for position updates
            this.position.x += this.velocity.x * 0.016 * this.scale;
            this.position.y += -this.velocity.y * 0.016 * this.scale;  // Negative for canvas Y coordinates

            this.simCtx.beginPath();
            this.simCtx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2);
            this.simCtx.fillStyle = 'red';
            this.simCtx.fill();

            this.drawVelocityVectors();
            this.updateGraph();
            
            this.time += 0.016;
            this.timeSlider.value = (this.time / this.totalTime) * 100;
            document.getElementById('timeValue').textContent = this.time.toFixed(2) + 's';

            // Track maximum height during simulation
            const currentHeight = (this.simCanvas.height - 50 - this.position.y) / this.scale;
            this.maxHeight = Math.max(this.maxHeight || 0, currentHeight);  // Add || 0 to handle undefined

            if (this.position.y < this.simCanvas.height - 50) {
                this.animationFrame = requestAnimationFrame(() => this.animate());
            } else {
                this.position.y = this.simCanvas.height - 50;
                this.isSimulating = false;
                this.isPaused = true;
                document.getElementById('pausePlay').textContent = 'Play';
                
                // Display final values using tracked max height
                requestAnimationFrame(() => {
                    document.getElementById('maxHeight').textContent = this.maxHeight.toFixed(2);
                    document.getElementById('range').textContent = 
                        ((this.position.x - 50) / this.scale).toFixed(2);
                });
            }
        }
    }

    // Remove trajectory calculations from drawPreview
    drawPreview() {
        this.simCtx.clearRect(0, 0, this.simCanvas.width, this.simCanvas.height);
        this.drawGround();

        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;
        
        let x = 50;
        let y = this.simCanvas.height - 50;
        let vx = velocity * Math.cos(angle);
        let vy = velocity * Math.sin(angle);

        this.simCtx.beginPath();
        this.simCtx.setLineDash([5, 5]);
        this.simCtx.moveTo(x, y);

        while (y <= this.simCanvas.height - 50) {
            if (this.hasAirResistance) {
                const speed = Math.sqrt(vx * vx + vy * vy);
                vx += -this.k * speed * vx * 0.016;
                vy += (-this.g - this.k * speed * vy) * 0.016;
            } else {
                vy += -this.g * 0.016;
            }

            x += vx * 0.016 * this.scale;
            y += -vy * 0.016 * this.scale;

            if (y <= this.simCanvas.height - 50) {
                this.simCtx.lineTo(x, y);
            }
        }

        this.simCtx.stroke();
        this.simCtx.setLineDash([]);
    }

    drawGraphAxes() {
        // Use a single max value for both components
        const maxVel = Math.max(
            ...this.dataPoints.map(p => Math.abs(p.vx)),
            ...this.dataPoints.map(p => Math.abs(p.vy))
        ) * 1.2;
        
        const yCenter = this.graphCanvas.height/2;
        
        this.graphCtx.beginPath();
        this.graphCtx.strokeStyle = 'black';
        
        this.graphCtx.moveTo(50, 30);
        this.graphCtx.lineTo(50, this.graphCanvas.height - 30);
        this.graphCtx.moveTo(50, yCenter);
        this.graphCtx.lineTo(this.graphCanvas.width - 30, yCenter);
        this.graphCtx.stroke();

        this.graphCtx.font = '12px Arial';
        this.graphCtx.textAlign = 'right';
        
        for (let v = -maxVel; v <= maxVel; v += maxVel/4) {
            const y = yCenter - (v * (this.graphCanvas.height - 60) / (2 * maxVel));
            this.graphCtx.moveTo(45, y);
            this.graphCtx.lineTo(50, y);
            this.graphCtx.fillText(v.toFixed(1), 40, y + 4);
        }
        
        const width = this.graphCanvas.width - 80;
        const timeStep = this.totalTime / 5;
        for (let t = 0; t <= this.totalTime; t += timeStep) {
            const x = 50 + (t / this.totalTime) * width;
            this.graphCtx.moveTo(x, yCenter - 5);
            this.graphCtx.lineTo(x, yCenter + 5);
            this.graphCtx.textAlign = 'center';
            this.graphCtx.fillText(t.toFixed(1), x, yCenter + 20);
        }
        
        this.graphCtx.textAlign = 'center';
        this.graphCtx.fillText('Time (s)', this.graphCanvas.width/2, this.graphCanvas.height - 5);
        
        this.graphCtx.save();
        this.graphCtx.translate(15, this.graphCanvas.height/2);
        this.graphCtx.rotate(-Math.PI/2);
        this.graphCtx.fillText('Velocity (m/s)', 0, 0);
        this.graphCtx.restore();
        
        this.graphCtx.textAlign = 'left';
        this.graphCtx.fillStyle = 'blue';
        this.graphCtx.fillText('Vx', 60, 20);
        this.graphCtx.fillStyle = 'green';
        this.graphCtx.fillText('Vy', 90, 20);
    }

    drawGround() {
        this.simCtx.beginPath();
        this.simCtx.moveTo(0, this.simCanvas.height - 50);
        this.simCtx.lineTo(this.simCanvas.width, this.simCanvas.height - 50);
        this.simCtx.strokeStyle = '#000';
        this.simCtx.lineWidth = 2;
        this.simCtx.stroke();
        this.simCtx.lineWidth = 1;
    }

    plotVelocityComponent(data, color) {
        if (data.length < 2) return;

        const width = this.graphCanvas.width - 80;
        const maxVel = Math.max(
            ...this.dataPoints.map(p => Math.abs(p.vx)),
            ...this.dataPoints.map(p => Math.abs(p.vy))
        ) * 1.2;

        this.graphCtx.beginPath();
        this.graphCtx.strokeStyle = color;
        
        data.forEach((v, i) => {
            const x = 50 + (this.dataPoints[i].time / this.totalTime) * width;
            const y = this.graphCanvas.height/2 - (v * (this.graphCanvas.height - 60) / (2 * maxVel));
            if (i === 0) this.graphCtx.moveTo(x, y);
            else this.graphCtx.lineTo(x, y);
        });
        
        this.graphCtx.stroke();
    }

    calculateTotalTime() {
        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;
        const vy = -velocity * Math.sin(angle);
        return (-2 * vy) / this.g;
    }

    updateSimulationState() {
        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;
        
        this.position = { x: 50, y: this.simCanvas.height - 50 };
        let vx = velocity * Math.cos(angle);
        let vy = velocity * Math.sin(angle);  // Remove negative sign
        
        // Reset dataPoints with new initial velocities
        this.dataPoints = [{
            time: 0,
            vx: vx,
            vy: vy  // Store actual vy value
        }];
        
        for (let t = 0; t < this.time; t += 0.016) {
            const speed = Math.sqrt(vx * vx + vy * vy);
            
            if (this.hasAirResistance) {
                vx += -this.k * speed * vx * 0.016;
                vy += (this.g - this.k * speed * vy) * 0.016;
            } else {
                vy += this.g * 0.016;
            }
            
            this.position.x += vx * 0.016 * this.scale;
            this.position.y += vy * 0.016 * this.scale;
            
            // Add data point for each time step
            this.dataPoints.push({
                time: t,
                vx: vx,
                vy: -vy
            });
        }
        
        this.velocity = { x: vx, y: vy };
        this.drawSimulationFrame();
    }

    drawSimulationFrame() {
        this.simCtx.clearRect(0, 0, this.simCanvas.width, this.simCanvas.height);
        this.drawGround();
        
        this.simCtx.beginPath();
        this.simCtx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2);
        this.simCtx.fillStyle = 'red';
        this.simCtx.fill();
        
        this.drawVelocityVectors();
        this.updateGraph();
    }

    restartSimulation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Reset time and slider
        this.time = 0;
        this.maxHeight = 0;  // Initialize maxHeight
        this.timeSlider.value = 0;
        document.getElementById('timeValue').textContent = '0.00s';
        
        // Clear graph
        this.graphCtx.clearRect(0, 0, this.graphCanvas.width, this.graphCanvas.height);
        this.drawGraphAxes();
        
        // Reset simulation state
        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;
        
        this.position = { x: 50, y: this.simCanvas.height - 50 };
        this.velocity = {
            x: velocity * Math.cos(angle),
            y: velocity * Math.sin(angle)
        };
        this.dataPoints = [{
            time: 0,
            vx: this.velocity.x,
            vy: this.velocity.y
        }];
        
        // Reset canvas and draw initial state
        this.simCtx.clearRect(0, 0, this.simCanvas.width, this.simCanvas.height);
        this.drawGround();
        this.simCtx.beginPath();
        this.simCtx.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2);
        this.simCtx.fillStyle = 'red';
        this.simCtx.fill();
        this.drawVelocityVectors();
        
        this.isSimulating = true;
        this.isPaused = true;
        document.getElementById('pausePlay').textContent = 'Play';
    }

    updateSimulationState() {
        const velocity = parseFloat(document.getElementById('velocity').value);
        const angle = parseFloat(document.getElementById('angle').value) * Math.PI / 180;
        
        this.position = { x: 50, y: this.simCanvas.height - 50 };
        this.velocity = {
            x: velocity * Math.cos(angle),
            y: velocity * Math.sin(angle)
        };
        
        // Reset dataPoints with new initial velocities
        this.dataPoints = [{
            time: 0,
            vx: this.velocity.x,
            vy: this.velocity.y
        }];
        
        // Simulate up to current time
        for (let t = 0; t < this.time; t += 0.016) {
            const speed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2);
            
            if (this.hasAirResistance) {
                this.velocity.x += -this.k * speed * this.velocity.x * 0.016;
                this.velocity.y += (-this.g - this.k * speed * this.velocity.y) * 0.016;
            } else {
                this.velocity.y += -this.g * 0.016;
            }
            
            this.position.x += this.velocity.x * 0.016 * this.scale;
            this.position.y += -this.velocity.y * 0.016 * this.scale;
            
            this.dataPoints.push({
                time: t,
                vx: this.velocity.x,
                vy: this.velocity.y
            });
        }
        
        this.drawSimulationFrame();
    }
}

// Initialize the simulation when the page loads
window.addEventListener('load', () => {
    new ProjectileSimulation();
});