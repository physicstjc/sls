# Charge Lab — induction in your hands

An educational 3D electrostatic induction experiment with WebXR table placement, an ordinary 3D view, and a separate MediaPipe camera mode. Open `index.html` through an HTTPS host or localhost (for example, run `python3 -m http.server 8000` from this folder). No build step or API key is needed. All runtime libraries, WASM variants, and the hand model are bundled.

## Explore

- Move the negative rod toward and away from the metal sphere with the gap slider, by dragging the selected apparatus, or by pinching with thumb and index finger on camera.
- Select **Sphere and stand** to reposition the stand. The stand remains insulating; **Connect sphere to earth** adds a separate conducting wire.
- Enable camera, show one hand, point at the selected object and pinch to grab it. Release to drop. Green hand landmarks and a cursor show tracking. Camera permission is requested only on demand, and Stop camera stops its tracks. Frames are processed locally; this app contains no image upload or analytics code.
- Drag empty space to orbit, scroll/two-finger pinch to zoom, right-drag to pan. The arrow buttons rotate the view during hand tracking. Reset view and Reset experiment are separate. The view follows the compact `fleming-ar` layout: a 28 px header, controls hidden by default, a persistent bottom experiment bar, and live charge readouts on the scene. Show controls reveals the learning panel at the side on desktop or below the view on phones. Fit view frames the current apparatus positions; resizing preserves the viewing direction while refitting the apparatus.
- Pause freezes charge motion and transfer while leaving the view interactive.

Try: bring the rod close → connect earth → wait for electrons to leave → disconnect earth → withdraw rod. The sphere retains a positive net charge. Reconnect earth with the rod far away to neutralise it.

## Scientific model and limitations

The sphere has 64 fixed representative positive ion sites and initially 64 mobile electron symbols. The negative rod repels the mobile electrons; fixed positive ions do not migrate. An isolated sphere conserves its electron deficit. An earthed sphere can exchange electrons with earth along the separate wire. The rod never touches the sphere, so there is no contact charging.

Geometry uses illustrative lab units. The radial gap is centre separation minus the sphere radius (1) and rod half-length (0.9); the rod turns to point toward the sphere. Motion is on the horizontal plane through its centre. Gap is clamped to 0.15–5 units.

`physics.js` defines qualitative induction strength `max(0, exp(-gap/1.35) - exp(-5/1.35))`. Grounded equilibrium removes `round(28 × strength)` of the 64 representative electrons, relaxing one symbol per 55 ms. Isolated mode preserves this deficit. The far slider endpoint represents negligible influence. Surface electron targets are biased away from the rod; transfer symbols follow the earth wire. These are teaching visualisations, not a solution of the conductor boundary-value problem. Charge symbols, times, and distances are exaggerated; the positive sites on the surface represent the fixed ionic background rather than a literal atomic structure. The charge readout counts representative symbols, not coulombs. There is no field, force, spark, leakage, or collision solver.

## WebXR mode

Tap **Place on table · WebXR**, grant AR access, and slowly scan a well-lit horizontal surface. Tap when the green ring appears to place the experiment. One illustrative lab unit is rendered as 4.5 cm. Move the phone to change viewpoint. This mode uses the XR device's tracked camera and local reference space, with no printed marker. **Place again** rescans for a new surface; the arrows rotate the apparatus at its placement. **Exit WebXR** returns to the ordinary orbit view.

Choose the rod or sphere/stand with **Move**. Touch and hold near that object, move your touch ray to drag along the horizontal plane through the sphere centre, and release. On devices exposing WebXR hand joint poses, pinch thumb and index within 2.5 cm to grab an object nearby, move the hand, then separate them beyond 4 cm to release. Pinching far from the apparatus does not grab it. The lab coordinates and gap limits remain shared with the physics model. Losing XR tracking hides the apparatus and releases the grab until tracking recovers.

Requires HTTPS and an immersive-AR WebXR runtime with hit testing and DOM overlay support. The interface detects support, and failed/unsupported AR leaves the ordinary 3D and camera modes available. Touch-based WebXR interaction does **not** imply native hand tracking is available on a phone. Raw XR passthrough frames are not requested or sent to MediaPipe: the two camera modes run separately. The app does not solve real-hand occlusion or provide persistent anchors across sessions; placement stability depends on the XR runtime's tracking.

## Camera + hand tracking fallback

This separate mode prefers the rear (environment-facing) camera and uses an unmirrored camera overlay with image-space MediaPipe interaction. Video, landmarks and grab cursor share the centred cover crop. Devices without a rear camera may use the available camera. The virtual viewpoint in this fallback remains independent of the camera. Camera and WebXR sessions are mutually exclusive. Use orbit controls to inspect the simulation, or use the sliders without granting camera access.

## Verification

`node physics.test.cjs` checks conservation, earthing, induction retention after withdrawal, neutralisation, pause, and finite surface positions. Headless Chromium checks exercised those controls, reset, collapse, and 1440 × 960 / 390 × 844 layouts with no JavaScript errors. A synthetic camera stream exercised the real local MediaPipe runtime/model and inference, plus stopping the stream. This does not validate physical hand tracking accuracy or real mobile-camera behaviour.

Dependencies: Three.js r128 and matching OrbitControls (MIT; `vendor/THREE-LICENSE.txt`); MediaPipe Tasks Vision 0.10.21 and official float16 Hand Landmarker model v1 (Apache 2.0; `vendor/MEDIAPIPE-LICENSE.txt`). Assets reused from the repository's `fleming-ar/vendor` bundle. Source: https://ai.google.dev/edge/mediapipe/solutions/vision/hand_landmarker/web_js .

Layout revision: browser checks cover desktop (1440 × 960), portrait (390 × 844), and landscape (844 × 390), controls shown/hidden, reachable essential controls, no horizontal overflow, and earthing at minimum gap. No JavaScript errors were observed.

WebXR checks: `node --test webxr.test.mjs` exercises seven cases using real Three.js geometry and mocked XR sessions/frames: feature requests, overlay input suppression, horizontal-only placement, scale, touch-ray dragging, native-hand pinching, tracking interruption/recovery, repositioning, cleanup, and startup failure. Chromium checks cover the ordinary desktop/portrait/landscape layouts and unsupported-WebXR fallback. These tests do not validate an actual immersive session, surface detection quality, phone tracking stability, or physical hand accuracy; those require a compatible physical device.
