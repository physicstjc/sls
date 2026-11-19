import Foundation

/// Qualitative representative-charge model shared with the web experiment.
/// Positions are illustrative lab units; the AR renderer chooses their visual scale.
public struct ChargePhysics {
    public static let count = 64
    public static let minimumGap: Float = 0.15
    public static let maximumGap: Float = 5
    public var gap: Float = 1.4
    public var grounded = false
    public var paused = false
    public private(set) var missing = 0
    private var relaxation: Float = 0

    public init() {}
    public static func strength(_ gap: Float) -> Float {
        guard gap.isFinite else { return 0 }
        let value = min(maximumGap, max(minimumGap, gap))
        return max(0, exp(-value / 1.35) - exp(-maximumGap / 1.35))
    }
    public static func equilibrium(_ gap: Float) -> Int {
        Int((28 * strength(gap)).rounded())
    }
    public mutating func advance(by seconds: Float) {
        guard grounded, !paused else { relaxation = 0; return }
        guard seconds.isFinite, seconds > 0 else { return }
        relaxation += min(seconds, 0.05)
        while relaxation >= 0.055 {
            relaxation -= 0.055
            let target = Self.equilibrium(gap)
            missing += target == missing ? 0 : (target > missing ? 1 : -1)
        }
    }
    public mutating func reset() { self = ChargePhysics() }
    public static func site(_ index: Int) -> SIMD3<Float> {
        let y = 1 - 2 * (Float(index) + 0.5) / Float(count)
        let a = Float(index) * 2.399963229728653
        let radius = sqrt(max(0, 1 - y * y))
        return SIMD3(cos(a) * radius, y, sin(a) * radius)
    }
    /// A finite, non-contact rod offset, including when dragged onto the centre.
    public static func constrainedOffset(_ offset: SIMD3<Float>, gap: Float? = nil) -> SIMD3<Float> {
        let x = offset.x.isFinite ? offset.x : 1
        let z = offset.z.isFinite ? offset.z : 0
        let length = sqrt(x * x + z * z)
        let direction = length > 0.0001 ? SIMD3(x / length, 0, z / length) : SIMD3<Float>(1, 0, 0)
        let desired = gap.map { min(maximumGap, max(minimumGap, $0.isFinite ? $0 : minimumGap)) + 1.9 }
        let distance = desired ?? min(maximumGap + 1.9, max(minimumGap + 1.9, length))
        return direction * distance
    }
}
