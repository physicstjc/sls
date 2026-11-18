# Motor Lab — Fleming’s left-hand rule

A mobile-first, buildless camera-overlay AR activity. A Three.js DC motor provides the physical context; MediaPipe Hand Landmarker estimates the thumb, index and middle finger directions in 3D and gives formative feedback.

## Run and deploy

Serve this directory or its parent over HTTP for a localhost preview:

```sh
cd fleming-ar
python3 -m http.server 8080
```

Open `http://localhost:8080`. Camera access on a phone requires **HTTPS**; an ordinary LAN HTTP address is not sufficient. Deploy the complete `fleming-ar/` folder to GitHub Pages. The existing `physicstjc/sls` workflow publishes the repository root, so the app is available at `/fleming-ar/` after deployment. All asset paths are relative; no build or server API is needed. The manifest supports adding the web app to a home screen; no service worker or guaranteed offline cache is provided.

## Learning flow

1. Explore the rotating rectangular coil, permanent magnets, brushes and split-ring commutator. Reverse the field or swap the brush connections to reverse rotation; change both to preserve it. Red supply wire always remains on cell positive; black always remains on negative.
2. Choose Practise. The rotor is held at a chosen front-view angle; select A (permanent red half) or B (permanent black half). A separate outline selects the side without recolouring it. The orientation slider and target card define the assessed directions.
3. Start the camera, show only the real left hand, and explicitly confirm it. Reconfirm after changing cameras. The camera feed is unmirrored.
4. Point the first finger along B (N to S), the second along conventional current, and the thumb along force. Hold a matching pose for 1.2 seconds. Try another direction, change the coil angle, or swap brush connections to explore how commutation changes the current relative to the coloured coil.

The motor is screen-anchored over the camera image. It does not detect surfaces, use WebXR, or maintain a world-space anchor when the phone moves. The scene is true 3D mesh geometry. Runtime camera access is requested only by the Start button, without audio. Camera tracks stop when the activity is hidden, stopped, or returned to Explore.

## Feedback model and limits

- Targets follow **F = Iℓ × B**. At the teaching position, B is screen-horizontal; current is into/out of the screen; force is approximately vertical. The camera is slightly elevated to reveal the coil, and assessment transforms the motor's exact vectors into camera coordinates. Side A and side B have opposite current and force.
- MediaPipe world landmarks are converted into camera axes (x right, y up, z toward viewer). Directions use MCP-to-tip vectors for the index and middle fingers and landmark 2-to-4 for the thumb. Minimal direction-vector length, framing, palm size, handedness confidence and pairwise perpendicularity gate assessment.
- Direction tolerance: 36°. Pairwise angles: 90° ± 30°. These are practical prototype tolerances, not validated grading criteria. The confidence threshold concerns handedness; it is not a per-joint depth confidence measure.
- The student's explicit left-hand confirmation calibrates which model label to accept, avoiding assumptions about selfie mirroring. This is self-confirmation, not independent proof that the physical hand is left. The other classified hand is then rejected.
- Success requires a continuous 1.2-second match; missing, multiple or stale hands reset the timer. Unique target combinations are counted only in session memory. Nothing is stored or uploaded.
- A monocular camera estimates depth. Overlap, occlusion, lighting, foreshortening, unusual hand poses and model bias can cause incorrect feedback. Keep the joints visible and treat feedback as a practice aid. Ring/little finger posture is not assessed. Classroom validation with real hands and multiple phones remains necessary.
- Rotation and supply strength are illustrative. This is not an electrical circuit solver, calibrated motor dynamics, or an RPM measurement. The current reverses relative to each physical coil half every half-turn and the indicated force couple gives the same torque sense. Insulating gaps (90°/270°, with a small angular width) break the circuit; no current/force arrows or pose matches are produced there. The animation represents inertia carrying the coil across these gaps. Zero supply also hides current/force arrows and cannot earn a match.

## Assets and privacy

All runtime files, including the model and both SIMD and non-SIMD WebAssembly variants, are bundled in `vendor/` (about 27 MiB total). The 3D activity opens first; camera setup then loads the model and the appropriate WASM variant on demand. There are no third-party runtime requests, analytics, accounts, LRS calls, camera-frame uploads or saved student records.

- Three.js and OrbitControls r128: MIT, `vendor/THREE-LICENSE.txt`.
- MediaPipe Tasks Vision 0.10.21: Apache 2.0, `vendor/MEDIAPIPE-LICENSE.txt`.
- Hand Landmarker model: official float16 bundle, version 1, from `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task` (MediaPipe Apache 2.0 distribution).
- MediaPipe runtime source: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/`; the SIMD WASM was retrieved from the equivalent pinned unpkg package.

Official references: [MediaPipe Hand Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js), [camera secure contexts](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

## Checks

Run `npm test` here. The 29 unit tests cover all polarity/side combinations, incorrect direction, calibration, uncertain/occluded inputs, natural finger bends and indeterminate directions, supply-off behaviour, hold continuity, permission rejection and cancellation. Additional checks exercise commutator contact before/after a half-turn, the gaps, fixed mesh colours, fixed cell-terminal attachment during lead swapping, and agreement between real Three.js arrow transforms and assessment targets. `tests/runtime.html` loads the real bundled model and runs inference on a blank image without a webcam; it passed in Chrome. The app was visually checked in desktop and 400 px mobile-emulation views with no console errors observed. These checks do not validate real-world MediaPipe accuracy or physical mobile-camera compatibility.

## Reference apparatus and sign convention

The virtual apparatus follows the supplied classroom motor references: clear stand and rear drum, permanent red/black square-loop halves, fixed red-positive and black-negative cell leads, carbon brushes, split-ring commutator, and explicitly labelled N/S poles. Geometry is schematic rather than a dimensionally exact replica. It does not automatically recognise or measure a physical motor in the camera image.

The commutator is behind the loop at negative z. At 0° the red half A is left, touching the left brush fed by the positive red lead. Its current runs out from the commutator (+z); black half B returns current toward it (−z). At 180°, A touches the negative brush and its current is −z. Coil colours do not change. `circuit.js` is the shared authority for contacts, current, force and gap states used by the 3D model, contact readout and hand assessment.

Finger straightness is not scored: joint-bend checks are omitted, and modest bends are accepted when the overall base-to-tip directions match. Only near-zero direction vectors are withheld as unclear. The direction and perpendicularity tolerances are unchanged.
