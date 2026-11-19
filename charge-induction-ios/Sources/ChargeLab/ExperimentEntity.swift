import RealityKit
import UIKit
import simd

@MainActor
final class ExperimentEntity {
    let root = Entity()
    let stand = Entity()
    let rod = Entity()
    private let wire = Entity()
    private let earth = Entity()
    private var ions: [ModelEntity] = []
    private var electrons: [ModelEntity] = []
    private var rodCharges: [ModelEntity] = []
    private var travel = Array(repeating: Float(0), count: ChargePhysics.count)
    private var physics = ChargePhysics()
    private var lastGrounded = false
    private var lastCentre = SIMD3<Float>.zero
    var gap: Float { simd_length(rod.position - centre) - 1.9 }
    var centre: SIMD3<Float> { stand.position + SIMD3(0, 2.25, 0) }
    var missing: Int { physics.missing }

    init() throws {
        root.addChild(stand); root.addChild(rod); root.addChild(wire); root.addChild(earth)
        stand.name = "stand"; rod.name = "rod"
        let base = SimpleMaterial(color: UIColor(red: 0.22, green: 0.34, blue: 0.40, alpha: 1), isMetallic: true)
        add(.generateCylinder(height: 0.15, radius: 0.8), base, to: stand, at: [0, 0.12, 0])
        add(.generateCylinder(height: 1.2, radius: 0.17), SimpleMaterial(color: UIColor.systemCyan.withAlphaComponent(0.38), isMetallic: false), to: stand, at: [0, 0.8, 0])
        add(.generateSphere(radius: 1), SimpleMaterial(color: UIColor(white: 0.8, alpha: 0.48), isMetallic: true), to: stand, at: [0, 2.25, 0])
        let barrel = add(.generateCylinder(height: 1.8, radius: 0.22), SimpleMaterial(color: .init(red: 0.12, green: 0.27, blue: 0.47, alpha: 1), isMetallic: true), to: rod, at: .zero)
        barrel.orientation = simd_quatf(angle: .pi / 2, axis: [0, 0, 1])
        let handle = add(.generateCylinder(height: 0.7, radius: 0.13), base, to: rod, at: [1.2, 0, 0])
        handle.orientation = barrel.orientation
        let positive = try symbol("+", color: .systemRed, size: 0.16)
        let negative = try symbol("−", color: .systemBlue, size: 0.19)
        for _ in 0..<ChargePhysics.count {
            let ion = positive.clone(recursive: false), electron = negative.clone(recursive: false)
            root.addChild(ion); root.addChild(electron); ions.append(ion); electrons.append(electron)
        }
        for index in 0..<12 {
            let symbol = negative.clone(recursive: false)
            symbol.position = [-0.72 + Float(index % 6) * 0.28, index < 6 ? 0.13 : -0.13, 0.23]
            rod.addChild(symbol); rodCharges.append(symbol)
        }
        reset()
    }

    @discardableResult private func add(_ mesh: MeshResource, _ material: SimpleMaterial, to parent: Entity, at position: SIMD3<Float>) -> ModelEntity {
        let entity = ModelEntity(mesh: mesh, materials: [material]); entity.position = position; parent.addChild(entity); return entity
    }

    private func symbol(_ text: String, color: UIColor, size: Float) throws -> ModelEntity {
        let format = UIGraphicsImageRendererFormat(); format.scale = 1; format.opaque = false
        let image = UIGraphicsImageRenderer(size: CGSize(width: 128, height: 128), format: format).image { context in
            let circle = UIBezierPath(ovalIn: CGRect(x: 8, y: 8, width: 112, height: 112))
            UIColor.white.withAlphaComponent(0.94).setFill(); circle.fill()
            color.setStroke(); circle.lineWidth = 5; circle.stroke()
            let attributes: [NSAttributedString.Key: Any] = [.font: UIFont.systemFont(ofSize: 96, weight: .bold), .foregroundColor: color]
            let dimensions = text.size(withAttributes: attributes)
            text.draw(at: CGPoint(x: (128 - dimensions.width) / 2, y: (128 - dimensions.height) / 2 - 2), withAttributes: attributes)
        }
        guard let cgImage = image.cgImage else { throw CocoaError(.fileReadCorruptFile) }
        let texture = try TextureResource.generate(from: cgImage, options: .init(semantic: .color))
        var material = UnlitMaterial()
        material.color = .init(tint: .white, texture: .init(texture))
        material.blending = .transparent(opacity: .init(floatLiteral: 1))
        return ModelEntity(mesh: .generatePlane(width: size, height: size), materials: [material])
    }

    func reset() {
        physics.reset(); stand.position = [-1, 0, 0]; rod.position = [2.3, 2.25, 0]
        travel = Array(repeating: 0, count: ChargePhysics.count); lastGrounded = false
        constrainRod(); lastCentre = centre
        for index in ions.indices {
            let n = ChargePhysics.site(index)
            ions[index].position = centre + n * 1.012
            electrons[index].position = centre + n * 1.065
            electrons[index].isEnabled = true
        }
        updateWire(); wire.isEnabled = false; earth.isEnabled = false
    }

    func setGap(_ gap: Float) {
        rod.position = centre + ChargePhysics.constrainedOffset(rod.position - centre, gap: gap)
        constrainRod()
    }
    func constrainRod() {
        let offset = ChargePhysics.constrainedOffset(rod.position - centre)
        rod.position = centre + offset
        rod.orientation = simd_quatf(angle: -atan2(offset.z, offset.x), axis: [0, 1, 0])
    }
    func didMove() {
        constrainRod()
        let delta = centre - lastCentre
        // Reposition charges with the stand even while charge dynamics are paused.
        if simd_length_squared(delta) > 0 {
            for entity in ions + electrons { entity.position += delta }
        }
        lastCentre = centre; updateWire()
    }
    private var wirePoints: [SIMD3<Float>] {
        [centre + SIMD3(-0.7, -0.7, 0), centre + SIMD3(-1.5, -1.1, 0), centre + SIMD3(-2.1, -2.05, 0)]
    }
    private func line(from start: SIMD3<Float>, to end: SIMD3<Float>, parent: Entity, radius: Float = 0.025) {
        let vector = end - start, length = simd_length(vector)
        guard length > 0.0001 else { return }
        let entity = ModelEntity(mesh: .generateCylinder(height: length, radius: radius), materials: [SimpleMaterial(color: .systemTeal, isMetallic: true)])
        entity.position = (start + end) / 2
        entity.orientation = simd_quatf(from: SIMD3<Float>(0, 1, 0), to: vector / length)
        parent.addChild(entity)
    }
    private func updateWire() {
        for child in Array(wire.children) { child.removeFromParent() }
        for child in Array(earth.children) { child.removeFromParent() }
        let points = wirePoints
        for index in 0..<points.count - 1 { line(from: points[index], to: points[index + 1], parent: wire) }
        for index in 0..<3 {
            let halfWidth = 0.55 - Float(index) * 0.14, p = points[2] + SIMD3<Float>(0, -Float(index) * 0.10, 0)
            line(from: p - SIMD3(halfWidth, 0, 0), to: p + SIMD3(halfWidth, 0, 0), parent: earth, radius: 0.018)
        }
    }
    private func wirePosition(_ fraction: Float) -> SIMD3<Float> {
        let points = wirePoints, t = min(1, max(0, fraction)) * 2
        let segment = min(1, Int(t)), weight = t - Float(segment)
        return points[segment] * (1 - weight) + points[segment + 1] * weight
    }
    func update(seconds: Float, grounded: Bool, paused: Bool, cameraWorld: SIMD3<Float>) {
        physics.gap = gap; physics.grounded = grounded; physics.paused = paused; physics.advance(by: seconds)
        if grounded != lastGrounded { wire.isEnabled = grounded; earth.isEnabled = grounded; lastGrounded = grounded }
        let away = simd_normalize(centre - rod.position), bias = ChargePhysics.strength(gap) * 1.55
        let blend = 1 - exp(-seconds * 8)
        for index in ions.indices {
            let n = ChargePhysics.site(index)
            ions[index].position = centre + n * 1.012
            if !paused {
                let inEarth = index < physics.missing
                travel[index] = min(1, max(0, travel[index] + (inEarth ? 1 : -1) * seconds * 0.9))
                let target: SIMD3<Float>
                if travel[index] > 0 {
                    target = wirePosition(travel[index])
                } else {
                    let shifted = n + away * bias
                    target = centre + simd_normalize(shifted) * 1.065
                }
                electrons[index].position += (target - electrons[index].position) * blend
            }
            electrons[index].isEnabled = index >= physics.missing || grounded || travel[index] < 0.99
        }
        for symbol in ions + electrons + rodCharges {
            guard symbol.isEnabled, let parent = symbol.parent else { continue }
            let direction = parent.convert(position: cameraWorld, from: nil) - symbol.position
            if simd_length_squared(direction) > 0.00001 { symbol.orientation = simd_quatf(from: SIMD3<Float>(0, 0, 1), to: simd_normalize(direction)) }
        }
    }
}
