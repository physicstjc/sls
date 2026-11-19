import SwiftUI
import RealityKit
import ARKit
import AVFoundation
import Combine
import simd

@MainActor
struct LabARView: UIViewRepresentable {
    @ObservedObject var store: LabStore
    var active: Bool

    func makeCoordinator() -> Coordinator { Coordinator(store: store) }
    func makeUIView(context: Context) -> ARView {
        let view = ARView(frame: .zero, cameraMode: .ar, automaticallyConfigureSession: false)
        context.coordinator.attach(view)
        return view
    }
    func updateUIView(_ view: ARView, context: Context) { context.coordinator.setActive(active) }
    static func dismantleUIView(_ uiView: ARView, coordinator: Coordinator) { coordinator.stop() }

    @MainActor
    final class Coordinator: NSObject, ARSessionDelegate, UIGestureRecognizerDelegate {
        private let store: LabStore
        private weak var view: ARView?
        private var model: ExperimentEntity?
        private var anchor: AnchorEntity?
        private var arAnchor: ARAnchor?
        private let reticleAnchor = AnchorEntity(world: .zero)
        private let reticle = Entity()
        private var subscription: Cancellable?
        private var permissionTask: Task<Void, Never>?
        private var running = false
        private var active = true
        private var permissionRequested = false
        private var latestSurface: ARRaycastResult?
        private var normalTracking = false
        private var interrupted = false
        private var resetID = 0
        private var placementID = 0
        private var restartID = 0
        private var dragEntity: Entity?
        private var dragOffset = SIMD3<Float>.zero
        private var dragChoice: LabStore.ObjectChoice?
        private var pinchStart: Float = 0.045
        private var rotationStart = simd_quatf(angle: 0, axis: SIMD3<Float>(0, 1, 0))

        init(store: LabStore) { self.store = store }

        func attach(_ view: ARView) {
            self.view = view
            view.session.delegate = self
            for index in 0..<40 {
                let angle = Float(index) / 40 * 2 * Float.pi
                let segment = ModelEntity(mesh: .generateBox(size: [0.004, 0.0015, 0.008]), materials: [UnlitMaterial(color: .systemTeal)])
                segment.position = [cos(angle) * 0.04, 0.002, sin(angle) * 0.04]
                segment.orientation = simd_quatf(angle: -angle, axis: [0, 1, 0])
                reticle.addChild(segment)
            }
            reticleAnchor.addChild(reticle); reticle.isEnabled = false; view.scene.addAnchor(reticleAnchor)
            let tap = UITapGestureRecognizer(target: self, action: #selector(tapped(_:)))
            let pan = UIPanGestureRecognizer(target: self, action: #selector(panned(_:))); pan.maximumNumberOfTouches = 1
            let pinch = UIPinchGestureRecognizer(target: self, action: #selector(pinched(_:)))
            let rotation = UIRotationGestureRecognizer(target: self, action: #selector(rotated(_:)))
            let gestures: [UIGestureRecognizer] = [tap, pan, pinch, rotation]
            for gesture in gestures { gesture.delegate = self; view.addGestureRecognizer(gesture) }
            tap.require(toFail: pan)
            subscription = view.scene.subscribe(to: SceneEvents.Update.self) { [weak self] event in
                let seconds = Float(event.deltaTime)
                Task { @MainActor [weak self] in self?.tick(seconds: seconds) }
            }
            startIfAllowed()
        }

        func setActive(_ value: Bool) {
            guard active != value else { return }
            active = value
            if !value { view?.session.pause(); running = false; normalTracking = false; releaseDrag(); reticle.isEnabled = false; model?.root.isEnabled = false; store.readyToPlace = false }
            else if !running { startIfAllowed() }
        }
        private func startIfAllowed() {
            guard active, !running, permissionTask == nil else { return }
            guard ARWorldTrackingConfiguration.isSupported else {
                store.unavailable = true; store.setStatus("This device cannot run ARKit world tracking. Use an AR-capable iPhone; the Simulator cannot place this experiment."); return
            }
            let status = AVCaptureDevice.authorizationStatus(for: .video)
            if status == .authorized { store.cameraAllowed = true; runSession(); return }
            if status == .denied || status == .restricted {
                store.unavailable = true; store.setStatus("Camera access is needed for table tracking. Allow Camera in Settings, then return to Charge Lab."); return
            }
            guard !permissionRequested else { return }; permissionRequested = true
            permissionTask = Task { @MainActor [weak self] in
                let granted = await AVCaptureDevice.requestAccess(for: .video)
                guard let self, !Task.isCancelled else { return }
                self.permissionTask = nil; self.store.cameraAllowed = granted
                if granted { self.runSession() }
                else { self.store.unavailable = true; self.store.setStatus("Camera permission was not granted. You can enable it in Settings.") }
            }
        }
        private func runSession() {
            guard active, let view else { return }
            if model == nil {
                do { model = try ExperimentEntity() }
                catch { store.unavailable = true; store.setStatus("The charge symbols could not be created. Close and reopen the app."); return }
            }
            let configuration = ARWorldTrackingConfiguration()
            configuration.planeDetection = [.horizontal]
            configuration.environmentTexturing = .automatic
            view.session.run(configuration)
            running = true; interrupted = false; store.unavailable = false
            store.setStatus(store.placed ? "Recovering table tracking…" : "Slowly scan a well-lit table until the green ring appears.")
        }
        func stop() {
            permissionTask?.cancel(); permissionTask = nil; subscription?.cancel(); subscription = nil
            view?.session.pause(); view?.session.delegate = nil; running = false; releaseDrag()
        }

        private func surface(at point: CGPoint) -> ARRaycastResult? {
            view?.raycast(from: point, allowing: .existingPlaneGeometry, alignment: .horizontal).first
        }
        @objc private func tapped(_ recognizer: UITapGestureRecognizer) {
            guard !store.placed, normalTracking, !interrupted, let result = surface(at: recognizer.location(in: view)) else { return }
            place(result)
        }
        private func place(_ result: ARRaycastResult) {
            guard let view, let model else { return }
            removePlacement()
            let trackedAnchor = ARAnchor(name: "ChargeLab", transform: result.worldTransform)
            view.session.add(anchor: trackedAnchor)
            let entity = AnchorEntity(anchor: trackedAnchor)
            model.root.scale = SIMD3(repeating: 0.045)
            model.root.orientation = simd_quatf(angle: 0, axis: [0, 1, 0])
            entity.addChild(model.root); view.scene.addAnchor(entity)
            arAnchor = trackedAnchor; anchor = entity; reticle.isEnabled = false
            store.placed = true; store.readyToPlace = false
            store.setStatus("Placed. Drag near the selected object; move the phone to look around.")
        }
        private func removePlacement() {
            releaseDrag(); model?.root.removeFromParent()
            if let anchor { view?.scene.removeAnchor(anchor) }
            if let arAnchor { view?.session.remove(anchor: arAnchor) }
            anchor = nil; arAnchor = nil; store.placed = false
        }
        private func releaseDrag() { dragEntity = nil; dragChoice = nil }
        private func localPoint(_ point: CGPoint) -> SIMD3<Float>? {
            guard let view, let model, let ray = view.ray(through: point) else { return nil }
            let origin = model.root.convert(position: ray.origin, from: nil)
            let direction = simd_normalize(model.root.convert(direction: ray.direction, from: nil))
            guard abs(direction.y) > 0.06 else { return nil }
            let t = (2.25 - origin.y) / direction.y
            guard t > 0, t.isFinite else { return nil }
            return origin + direction * t
        }
        @objc private func panned(_ recognizer: UIPanGestureRecognizer) {
            guard store.placed, normalTracking, !interrupted, let view, let model else { releaseDrag(); return }
            let touch = recognizer.location(in: view)
            switch recognizer.state {
            case .began:
                let entity = store.selected == .rod ? model.rod : model.stand
                let localAnchor = entity.position + (store.selected == .stand ? SIMD3<Float>(0, 2.25, 0) : .zero)
                guard let projected = view.project(model.root.convert(position: localAnchor, to: nil)),
                      hypot(projected.x - touch.x, projected.y - touch.y) < 85,
                      let point = localPoint(touch) else { return }
                dragEntity = entity; dragChoice = store.selected; dragOffset = entity.position - point
            case .changed:
                guard dragChoice == store.selected, let entity = dragEntity, let point = localPoint(touch) else { releaseDrag(); return }
                let desired = point + dragOffset
                entity.position.x = min(5, max(-4, desired.x)); entity.position.z = min(3, max(-3, desired.z))
                model.didMove(); if abs(store.gap - model.gap) > 0.003 { store.gap = model.gap }
            default: releaseDrag()
            }
        }
        @objc private func pinched(_ recognizer: UIPinchGestureRecognizer) {
            guard store.placed, normalTracking, let model else { return }
            releaseDrag()
            if recognizer.state == .began { pinchStart = model.root.scale.x }
            if recognizer.state == .changed { model.root.scale = SIMD3(repeating: min(0.075, max(0.025, pinchStart * Float(recognizer.scale)))) }
        }
        @objc private func rotated(_ recognizer: UIRotationGestureRecognizer) {
            guard store.placed, normalTracking, let model else { return }
            releaseDrag()
            if recognizer.state == .began { rotationStart = model.root.orientation }
            if recognizer.state == .changed { model.root.orientation = rotationStart * simd_quatf(angle: -Float(recognizer.rotation), axis: [0, 1, 0]) }
        }
        nonisolated func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldRecognizeSimultaneouslyWith otherGestureRecognizer: UIGestureRecognizer) -> Bool {
            (gestureRecognizer is UIPinchGestureRecognizer && otherGestureRecognizer is UIRotationGestureRecognizer) || (gestureRecognizer is UIRotationGestureRecognizer && otherGestureRecognizer is UIPinchGestureRecognizer)
        }

        private func tick(seconds: Float) {
            guard let view, active else { return }
            if restartID != store.restartID { restartID = store.restartID; permissionRequested = false; running = false; startIfAllowed() }
            guard running, let frame = view.session.currentFrame, let model else { return }
            if resetID != store.resetID { resetID = store.resetID; releaseDrag(); model.reset() }
            if placementID != store.placementID {
                placementID = store.placementID
                if store.placed { removePlacement(); latestSurface = nil; store.setStatus("Scan the table again, then place the experiment.") }
                else if let latestSurface, normalTracking, !interrupted { place(latestSurface) }
            }
            switch frame.camera.trackingState {
            case .normal: normalTracking = !interrupted
            case .notAvailable: normalTracking = false; store.setStatus("AR tracking is unavailable. Move the phone slowly to recover.")
            case .limited(let reason):
                normalTracking = false
                switch reason {
                case .insufficientFeatures: store.setStatus("Aim at a textured, well-lit table. Plain or reflective surfaces are harder to track.")
                case .excessiveMotion: store.setStatus("Move the phone more slowly to recover tracking.")
                case .relocalizing: store.setStatus("Return the phone toward the table to recover the experiment.")
                default: store.setStatus("Starting table tracking. Move the phone slowly.")
                }
            }
            model.root.isEnabled = normalTracking && store.placed
            if !normalTracking { releaseDrag(); reticle.isEnabled = false; store.readyToPlace = false; return }
            if !store.placed {
                latestSurface = surface(at: CGPoint(x: view.bounds.midX, y: view.bounds.midY))
                let ready = latestSurface != nil
                if store.readyToPlace != ready { store.readyToPlace = ready }
                reticle.isEnabled = ready
                if let latestSurface { reticleAnchor.setTransformMatrix(latestSurface.worldTransform, relativeTo: nil); store.setStatus("Table found. Tap Place experiment or tap the table.") }
                else { store.setStatus("Scan a well-lit table until the green ring appears.") }
                return
            }
            if dragEntity == nil, abs(store.gap - model.gap) > 0.004 { model.setGap(store.gap) }
            let camera = frame.camera.transform.columns.3
            model.update(seconds: min(0.05, max(0, seconds)), grounded: store.grounded, paused: store.paused, cameraWorld: [camera.x, camera.y, camera.z])
            if store.missing != model.missing { store.missing = model.missing }
            store.setStatus(store.paused ? "Charge motion paused. You can still inspect the experiment." : "Drag near the selected object. Two fingers rotate or resize; move the phone to look around.")
        }

        nonisolated func sessionWasInterrupted(_ session: ARSession) {
            Task { @MainActor [weak self] in
                guard let self else { return }; self.interrupted = true; self.normalTracking = false; self.releaseDrag()
                self.reticle.isEnabled = false; self.model?.root.isEnabled = false; self.store.readyToPlace = false
                self.store.setStatus("AR was interrupted. Return to the table to recover tracking.")
            }
        }
        nonisolated func sessionInterruptionEnded(_ session: ARSession) {
            Task { @MainActor [weak self] in self?.interrupted = false; self?.store.setStatus("Recovering the table. Move the phone slowly.") }
        }
        nonisolated func session(_ session: ARSession, didFailWithError error: Error) {
            let message = error.localizedDescription
            Task { @MainActor [weak self] in
                guard let self else { return }; self.running = false; self.releaseDrag(); self.model?.root.isEnabled = false
                self.store.unavailable = true; self.store.readyToPlace = false; self.store.setStatus("AR stopped: \(message). Tap Try AR again.")
            }
        }
    }
}
