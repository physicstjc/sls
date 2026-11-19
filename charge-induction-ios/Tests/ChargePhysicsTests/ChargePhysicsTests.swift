import XCTest
@testable import ChargePhysics

final class ChargePhysicsTests: XCTestCase {
    func settle(_ model: inout ChargePhysics) { for _ in 0..<150 { model.advance(by: 0.05) } }
    func testIsolatedSphereConservesElectrons() {
        var model = ChargePhysics(); model.gap = 0.15; settle(&model)
        XCTAssertEqual(model.missing, 0)
    }
    func testNearRodDrivesElectronsToEarth() {
        var model = ChargePhysics(); model.grounded = true; model.gap = 0.15; settle(&model)
        XCTAssertEqual(model.missing, 24)
    }
    func testDisconnectBeforeWithdrawalRetainsPositiveCharge() {
        var model = ChargePhysics(); model.grounded = true; model.gap = 0.15; settle(&model)
        model.grounded = false; model.gap = 5; settle(&model)
        XCTAssertEqual(model.missing, 24)
    }
    func testWithdrawingWhileGroundedNeutralisesSphere() {
        var model = ChargePhysics(); model.grounded = true; model.gap = 0.15; settle(&model)
        model.gap = 5; settle(&model)
        XCTAssertEqual(model.missing, 0)
    }
    func testPausedPhysicsDoesNotTransferElectrons() {
        var model = ChargePhysics(); model.grounded = true; model.gap = 0.15; model.paused = true; settle(&model)
        XCTAssertEqual(model.missing, 0)
        model.paused = false; settle(&model); XCTAssertEqual(model.missing, 24)
    }
    func testResetRestoresNeutralIsolatedState() {
        var model = ChargePhysics(); model.grounded = true; model.gap = 0.15; settle(&model); model.reset()
        XCTAssertEqual(model.missing, 0); XCTAssertFalse(model.grounded); XCTAssertEqual(model.gap, 1.4)
    }
    func testFixedSitesAreFiniteUnitVectors() {
        for i in 0..<ChargePhysics.count {
            let v = ChargePhysics.site(i)
            XCTAssertTrue(v.x.isFinite && v.y.isFinite && v.z.isFinite)
            XCTAssertEqual(sqrt(v.x * v.x + v.y * v.y + v.z * v.z), 1, accuracy: 0.00001)
        }
    }
    func testRodCannotTouchSphereEvenAtCoincidentCentres() {
        for offset in [SIMD3<Float>.zero, [0.01, 0, 0], [99, 2, 0], [-1, 0, 1]] {
            let v = ChargePhysics.constrainedOffset(offset), length = sqrt(v.x * v.x + v.z * v.z)
            XCTAssertGreaterThanOrEqual(length, 2.05 - 0.00001)
            XCTAssertLessThanOrEqual(length, 6.9 + 0.00001)
            XCTAssertEqual(v.y, 0)
        }
    }
    func testGapSliderPreservesDirectionAndClampsExtremes() {
        let v = ChargePhysics.constrainedOffset([-1, 0, 0], gap: 999)
        XCTAssertEqual(v.x, -6.9, accuracy: 0.00001)
        let close = ChargePhysics.constrainedOffset([0, 0, 1], gap: -3)
        XCTAssertEqual(close.z, 2.05, accuracy: 0.00001)
    }
    func testInvalidTimeDoesNotCorruptModel() {
        var model = ChargePhysics(); model.grounded = true; model.gap = 0.15
        model.advance(by: .nan); model.advance(by: .infinity); model.advance(by: -1)
        XCTAssertEqual(model.missing, 0); settle(&model); XCTAssertEqual(model.missing, 24)
    }
    func testStrengthMonotonicAndFarEndpointZero() {
        XCTAssertGreaterThan(ChargePhysics.strength(0.15), ChargePhysics.strength(2))
        XCTAssertEqual(ChargePhysics.strength(5), 0)
        XCTAssertEqual(ChargePhysics.strength(.nan), 0)
    }
}
