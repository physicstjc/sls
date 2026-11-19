import SwiftUI

@MainActor
final class LabStore: ObservableObject {
    enum ObjectChoice: String, CaseIterable, Identifiable {
        case rod = "Rod", stand = "Sphere + stand"
        var id: Self { self }
    }
    @Published var gap: Float = 1.4
    @Published var grounded = false
    @Published var paused = false
    @Published var selected: ObjectChoice = .rod
    @Published var missing = 0
    @Published var placed = false
    @Published var readyToPlace = false
    @Published var cameraAllowed = false
    @Published var status = "Preparing the rear camera…"
    @Published var unavailable = false
    @Published var resetID = 0
    @Published var placementID = 0
    @Published var restartID = 0

    var charge: String { missing == 0 ? "Neutral" : "Positive +\(missing)" }
    var explanation: String {
        if grounded { return "Electrons can flow through the separate wire into earth, or return as the rod moves away." }
        if missing > 0 { return "Earth is disconnected. The sphere retains its electron deficit and stays positive when the rod moves away." }
        return "The rod pushes electrons to the far side. The isolated sphere still has equal positive and negative charge overall."
    }
    func resetExperiment() {
        gap = 1.4; grounded = false; paused = false; missing = 0; resetID += 1
    }
    func setStatus(_ message: String) { if status != message { status = message } }
}
