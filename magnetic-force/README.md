# Magnetic Force 3D Simulation

An interactive 3D physics simulation demonstrating the magnetic force on a current-carrying wire in a magnetic field, illustrating Newton's Third Law of motion.

## Features

- **3D Interactive Model**: Rotate, zoom, and interact with the apparatus using mouse or touch
- **Real-time Physics**: Lorentz force calculation with visual feedback on scale readings
- **Pedagogical UI**: On-screen controls, measurements, and guidance for better learning
- **Offline Capable**: All assets bundled locally - no internet required

## Physics Concept

The simulation shows:
- **Lorentz Force**: F = I × L × B (current × length × magnetic field)
- **Newton's Third Law**: Equal and opposite reaction force on the magnet
- **Force Measurement**: Scale reading changes based on magnetic interaction

## Controls

### On-Screen Buttons
- **Reset View**: Return camera to default position
- **Turn Switch On/Off**: Control circuit power
- **Reverse Current**: Flip battery polarity
- **Flip Magnet**: Swap north/south poles

### 3D Interaction
- **Drag Background**: Rotate view
- **Scroll/Pinch**: Zoom in/out
- **Click Objects**: Interact with components
- **Drag Rheostat Slider**: Adjust current (or use external slider)

### External Controls
- **Current Slider**: Adjust current from 0-10A
- **Measurements Panel**: Live readings of current, force, scale weight, switch state, and polarities

## Usage

1. Open `index.html` in any modern web browser
2. Click "Turn Switch On" to start the simulation
3. Adjust current using the slider or rheostat
4. Observe how the scale reading changes with magnetic force
5. Experiment with different polarities and orientations

## Technical Details

- Built with Three.js (local bundle included)
- Responsive design for desktop and mobile
- Touch-friendly controls for tablets
- No external dependencies required

## Files

- `index.html` - Main simulation file
- `three.min.js` - Three.js library (bundled locally)
- `README.md` - This documentation

## Browser Compatibility

Works in any modern browser with WebGL support:
- Chrome/Chromium
- Firefox
- Safari
- Edge

## Educational Notes

This simulation demonstrates the principle behind electromagnetic balances and force measurement in magnetic fields. The scale reading directly reflects the magnetic force acting on the system, providing a tangible way to visualize abstract physics concepts.