const canvas = document.getElementById("simulationCanvas");
const context = canvas.getContext("2d");

class PhysicsObject {
   constructor(x, y, radius, color) {
       this.x = x;
       this.y = y;
       this.radius = radius;
       this.color = color;
       this.vx = 0;
       this.vy = 0;
       this.ax = 0;
       this.ay = 9.8; // Gravity
       this.bounce = 0.7; // Coefficient of restitution
   }

   update(dt) {
       this.vx += this.ax * dt;
       this.vy += this.ay * dt;
       this.x += this.vx * dt;
       this.y += this.vy * dt;

       // Bounce off the bottom
       if (this.y + this.radius > canvas.height) {
           this.y = canvas.height - this.radius;
           this.vy = -this.vy * this.bounce;
       }
   }

   draw(context) {
       context.beginPath();
       context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
       context.fillStyle = this.color;
       context.fill();
       context.closePath();
   }
}

function drawGrid(context, width, height, gridSize) {
   context.strokeStyle = "lightgrey";
   for (let x = 0; x <= width; x += gridSize) {
       context.beginPath();
       context.moveTo(x, 0);
       context.lineTo(x, height);
       context.stroke();
   }
   for (let y = 0; y <= height; y += gridSize) {
       context.beginPath();
       context.moveTo(0, y);
       context.lineTo(width, y);
       context.stroke();
   }
}

const objects = [
   new PhysicsObject(100, 100, 20, "blue")
];

function loop() {
   context.clearRect(0, 0, canvas.width, canvas.height);
   drawGrid(context, canvas.width, canvas.height, 50);

   const dt = 1 / 60;
   objects.forEach(obj => {
       obj.update(dt);
       obj.draw(context);
   });

   requestAnimationFrame(loop);
}

loop();
