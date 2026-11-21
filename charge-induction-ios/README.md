# Charge Lab for iPhone

Native SwiftUI + ARKit + RealityKit version of the electrostatic induction experiment. The project targets **iOS 18 or later** and an ARKit-capable iPhone. No third-party packages, API keys, printed markers, or browser WebXR support are required.

## Run on your iPhone

1. Install the full **Xcode** app on your Mac, launch it, and allow it to install the iOS development components. Apple Command Line Tools alone cannot build this app.
2. Open **`ChargeLab.xcodeproj`**, not `Package.swift`. The Swift package is only the portable physics library and its tests.
3. Select the **ChargeLab** target → **Signing & Capabilities**. Choose your Apple development Team. Change `com.physicstjc.ChargeLab` to a bundle identifier available to your team if Xcode asks.
4. Connect and unlock your iPhone, trust the Mac if prompted, and enable Developer Mode if Xcode requests it. Select the physical iPhone as the run destination and press **Run**.
5. Grant camera permission. Slowly scan a well-lit, textured table. When the green ring appears, tap **Place experiment** or tap the detected table.

You can sign development builds for your own devices with an Apple Account configured in Xcode. TestFlight/App Store distribution requires separate signing and distribution setup. No signing identity or team has been embedded in this project.

The Simulator cannot validate this app's live table tracking. Use a physical iPhone for AR testing. See Apple's [device-running instructions](https://developer.apple.com/documentation/xcode/running-your-app-in-simulator-or-on-a-device).

## Explore

- Move the phone to inspect the world-tracked experiment from different viewpoints.
- Choose **Rod** or **Sphere + stand**, then drag near the selected object with one finger. Motion stays on the horizontal plane through the sphere centre, and object separation is constrained to avoid contact.
- Two fingers rotate the whole experiment around the table normal or resize it. The default visual scale is 4.5 cm per illustrative lab unit; resizing changes visual scale without changing charge calculations.
- Use the gap slider for precise separation. Switch **Earth sphere** to add a separate conducting wire; the stand itself remains insulating.
- Open **More** for pause, reset and placement controls. Reset charges restores the neutral isolated experiment while preserving its table placement. **Place again** removes that placement so you can choose another surface.
- To charge by induction: bring the rod close → connect earth → wait for electrons to leave → disconnect earth → withdraw the rod. The sphere retains positive charge. Reconnecting earth with the rod far away neutralises it.

This first native version uses **touch gestures**. It does not include Vision/MediaPipe camera-based free-hand pinch tracking. ARKit's rear camera controls the physical viewpoint; camera frames are not recorded or uploaded.

## Physics and rendering

`Sources/ChargePhysics/ChargePhysics.swift` ports the web experiment's qualitative model: 64 fixed representative positive-ion sites and initially 64 mobile electrons. Polarisation strength is `max(0, exp(-gap / 1.35) - exp(-5 / 1.35))`. Grounded equilibrium removes `round(28 × strength)` representative electrons, relaxing one symbol every 55 ms of bounded simulation time. Isolated mode conserves the resulting deficit. Pause freezes redistribution and transfer.

The metal sphere and insulating support are procedural RealityKit geometry. Red + and blue − symbols face the camera; electrons redistribute away from the rod and travel along the earth wire. Distances, times and discrete charge counts are teaching abstractions. These symbols are not literal atomic trajectories, and the calculation is not an electrostatic boundary-value solver. There is no contact transfer, force, spark, leakage or realistic hand-occlusion model.

A horizontal ARKit raycast provides the placement pose. An `ARAnchor` and matching `AnchorEntity` connect the model to world tracking. The app hides the experiment during limited/interrupted tracking and releases active drags. It pauses the AR session while inactive and resumes tracking when active. Placement is not saved across app launches.

## Validation

From this folder, run:

```sh
python3 Scripts/check.py
```

This validates the Xcode project/property lists, shared scheme XML, asset JSON, Swift syntax, and executes the **11 actual physics test methods** through a small assertion adapter. It runs with the Apple Command Line Tools without requiring XCTest. The cases cover isolation, earthing, retained induction charge, neutralisation, pause/resume, reset, finite ion locations, non-contact drag bounds, separation extremes, invalid time steps, and strength limits.

With full Xcode selected, you can also run the XCTest suite for the portable library:

```sh
swift test
```

To compile the app after installing Xcode (without signing or installing it):

```sh
xcodebuild -project ChargeLab.xcodeproj -scheme ChargeLab \
  -destination 'generic/platform=iOS' -derivedDataPath /tmp/ChargeLabDerivedData \
  CODE_SIGNING_ALLOWED=NO build
```

**Build validation:** after installing Xcode 27.2, the iOS app compiled successfully for a generic iOS device, and Xcode also completed a signed build with the locally selected development team. The Issue Navigator was empty after rebuilding. The project now requires iOS 18 or later to match RealityKit cylinder mesh availability and uses the current texture initializer. Camera permissions, touch interaction, RealityKit appearance, and physical AR tracking still need checking on the iPhone; a successful build does not validate those behaviours.

Before relying on a device build, check: permission denial/recovery, a detected table, placement, rod and stand dragging, minimum/maximum gap, earth on/off, the induction sequence, pause/reset, two-finger rotation/scale, portrait/landscape rotation, app background/foreground, and tracking interruption/recovery.

## Project files

- `ChargeLab.xcodeproj`: app target and shared run scheme.
- `Sources/ChargeLab`: SwiftUI controls, AR session coordinator and RealityKit apparatus.
- `Sources/ChargePhysics`: standalone charge dynamics and geometric limits.
- `Tests/ChargePhysicsTests`: portable physics XCTest suite.
- `Resources`: camera-purpose text, privacy manifest, and app icon.
- `Scripts/generate-project.py`: reproducible project/metadata generator; no XcodeGen installation is needed.
- `Scripts/generate-icon.swift`: procedural app icon generator.

The project generator preserves stable object IDs. Signing team settings added directly in Xcode may be overwritten if you regenerate the project; set them again afterward.

Apple references: [ARWorldTrackingConfiguration](https://developer.apple.com/documentation/arkit/arworldtrackingconfiguration), [ARView](https://developer.apple.com/documentation/realitykit/arview), [AnchorEntity](https://developer.apple.com/documentation/realitykit/anchorentity), and [screen rays](https://developer.apple.com/documentation/realitykit/arview/ray(through:)).
