# Charge Lab — induction in your hands

An educational 3D electrostatic induction experiment with camera-overlay AR and MediaPipe finger controls. Open `index.html` through an HTTPS host or localhost (for example, run `python3 -m http.server 8000` from this folder). No build step or API key is needed. All runtime libraries, WASM variants, and the hand model are bundled.

## Explore

- Move the negative rod toward and away from the metal sphere with the gap slider, by dragging the selected apparatus, or by pinching with thumb and index finger on camera.
- Select **Sphere and stand** to reposition the stand. The stand remains insulating; **Connect sphere to earth** adds a separate conducting wire.
- Enable camera, show one hand, point at the selected object and pinch to grab it. Release to drop. Green hand landmarks and a cursor show tracking. Camera permission is requested only on demand, and Stop camera stops its tracks. Frames are processed locally; this app contains no image upload or analytics code.
- Drag empty space to orbit, scroll/two-finger pinch to zoom, right-drag to pan. The arrow buttons rotate the view during hand tracking. Reset view and Reset experiment are separate. Controls can collapse on phone or desktop.
- Pause freezes charge motion and transfer while leaving the view interactive.

Try: bring the rod close → connect earth → wait for electrons to leave → disconnect earth → withdraw rod. The sphere retains a positive net charge. Reconnect earth with the rod far away to neutralise it.

## Scientific model and limitations

The sphere has 64 fixed representative positive ion sites and initially 64 mobile electron symbols. The negative rod repels the mobile electrons; fixed positive ions do not migrate. An isolated sphere conserves its electron deficit. An earthed sphere can exchange electrons with earth along the separate wire. The rod never touches the sphere, so there is no contact charging.

Geometry uses illustrative lab units. The radial gap is centre separation minus the sphere radius (1) and rod half-length (0.9); the rod turns to point toward the sphere. Motion is on the horizontal plane through its centre. Gap is clamped to 0.15–5 units.

`physics.js` defines qualitative induction strength `max(0, exp(-gap/1.35) - exp(-5/1.35))`. Grounded equilibrium removes `round(28 × strength)` of the 64 representative electrons, relaxing one symbol per 55 ms. Isolated mode preserves this deficit. The far slider endpoint represents negligible influence. Surface electron targets are biased away from the rod; transfer symbols follow the earth wire. These are teaching visualisations, not a solution of the conductor boundary-value problem. Charge symbols, times, and distances are exaggerated; the positive sites on the surface represent the fixed ionic background rather than a literal atomic structure. The charge readout counts representative symbols, not coulombs. There is no field, force, spark, leakage, collision, or true world-plane tracking solver.

AR is a mirrored camera overlay with image-space hand interaction, rather than WebXR surface anchoring. Model and video perspective are independent. HTTPS/localhost and camera permission are required for tracking; mouse, touch and sliders remain usable without a camera. A physical hand and camera are needed to establish tracking accuracy for a particular device.

## Verification

`node physics.test.cjs` checks conservation, earthing, induction retention after withdrawal, neutralisation, pause, and finite surface positions. Headless Chromium checks exercised those controls, reset, collapse, and 1440 × 960 / 390 × 844 layouts with no JavaScript errors. A synthetic camera stream exercised the real local MediaPipe runtime/model and inference, plus stopping the stream. This does not validate physical hand tracking accuracy or real mobile-camera behaviour.

Dependencies: Three.js r128 and matching OrbitControls (MIT; `vendor/THREE-LICENSE.txt`); MediaPipe Tasks Vision 0.10.21 and official float16 Hand Landmarker model v1 (Apache 2.0; `vendor/MEDIAPIPE-LICENSE.txt`). Assets reused from the repository's `fleming-ar/vendor` bundle. Source: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js .
