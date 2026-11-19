import SwiftUI
import UIKit

@MainActor
struct ContentView: View {
    @StateObject private var store = LabStore()
    @Environment(\.scenePhase) private var scenePhase
    @Environment(\.verticalSizeClass) private var verticalSizeClass
    @State private var guide = false
    @State private var options = false

    var body: some View {
        VStack(spacing: 0) {
            HStack {
                Label("Charge Lab", systemImage: "minus.plus.batteryblock").font(.subheadline.bold())
                Spacer()
                Button("Guide", systemImage: "questionmark.circle") { guide = true }.font(.caption)
            }.padding(.horizontal, 14).padding(.vertical, 8).background(.regularMaterial)
            experimentLayout {
                arScene
                if verticalSizeClass == .compact {
                    ScrollView { controls }.frame(width: 280).background(.regularMaterial)
                } else {
                    controls
                }
            }
        }
        .tint(Color(red: 0.03, green: 0.48, blue: 0.52))
        .sheet(isPresented: $guide) { guideView }
    }

    // AnyLayout preserves the ARView and its tracked anchor on rotation.
    private var experimentLayout: AnyLayout {
        verticalSizeClass == .compact ? AnyLayout(HStackLayout(spacing: 0)) : AnyLayout(VStackLayout(spacing: 0))
    }

    private var arScene: some View {
        ZStack(alignment: .top) {
                LabARView(store: store, active: scenePhase == .active)
                    .accessibilityLabel("Augmented reality charge experiment. Move your phone to look around the apparatus.")
                VStack(spacing: 10) {
                    HStack {
                        Label(store.charge, systemImage: "circle.lefthalf.filled").font(.caption.bold())
                        Spacer()
                        Text("Earth: \(store.missing) / 64").font(.caption.monospacedDigit())
                    }.padding(10).background(.regularMaterial, in: RoundedRectangle(cornerRadius: 10))
                    Spacer()
                    Text(store.status).font(.caption).multilineTextAlignment(.center)
                        .padding(12).frame(maxWidth: .infinity)
                        .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 12))
                    if !store.placed && !store.unavailable {
                        Button("Place experiment", systemImage: "viewfinder") { store.placementID += 1 }
                            .buttonStyle(.borderedProminent).disabled(!store.readyToPlace)
                    }
                    if store.unavailable {
                        Button("Open camera settings", systemImage: "gear") {
                            if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
                        }.buttonStyle(.bordered)
                        Button("Try AR again") { store.restartID += 1 }.buttonStyle(.borderedProminent)
                    }
                }.padding(12)
            }.frame(maxWidth: .infinity, maxHeight: .infinity).clipped()
    }

    private var controls: some View {
        VStack(spacing: 9) {
            HStack {
                Text("Rod–sphere gap").font(.caption.bold())
                Spacer()
                Text(String(format: "%.2f lab units", store.gap)).font(.caption.monospacedDigit())
            }
            Slider(value: $store.gap, in: 0.15...5).accessibilityLabel("Rod to sphere surface gap")
                .disabled(!store.placed)
            HStack(spacing: 12) {
                Toggle("Earth sphere", isOn: $store.grounded).font(.caption).fixedSize()
                Spacer(minLength: 0)
                Picker("Move", selection: $store.selected) {
                    ForEach(LabStore.ObjectChoice.allCases) { Text($0.rawValue).tag($0) }
                }.pickerStyle(.menu).font(.caption)
            }.disabled(!store.placed)
            HStack {
                Button(store.paused ? "Resume" : "Pause", systemImage: store.paused ? "play.fill" : "pause.fill") { store.paused.toggle() }
                    .disabled(!store.placed)
                Spacer()
                Button("More", systemImage: "slider.horizontal.3") { options.toggle() }
            }.font(.caption).buttonStyle(.bordered)
            if options {
                HStack {
                    Button("Reset charges") { store.resetExperiment() }
                    Spacer()
                    Button("Place again") { store.placementID += 1 }
                }.font(.caption).disabled(!store.placed)
                Text(store.explanation).font(.caption).foregroundStyle(.secondary)
                Text("One finger: move selected object · two fingers: rotate or resize")
                    .font(.caption2).foregroundStyle(.secondary)
            }
        }.padding(.horizontal, 14).padding(.vertical, 10).background(.regularMaterial)
    }

    private var guideView: some View {
        NavigationStack {
            List {
                Section("Place the experiment") {
                    Text("Allow camera access, slowly scan a well-lit table, and tap Place experiment when the green ring appears. Move the iPhone to inspect the scene.")
                    Text("Choose Rod or Sphere + stand, then drag near it with one finger. Two fingers rotate or resize the whole apparatus. This first version uses touch gestures; camera-based hand gestures are not included.")
                }
                Section("Try charging by induction") {
                    Text("1. Bring the negative rod close.\n2. Connect the sphere to earth.\n3. Wait for blue electrons to leave.\n4. Disconnect earth first.\n5. Withdraw the rod. The sphere remains positive.")
                }
                Section("What the symbols mean") {
                    Label("Red +: fixed representative positive ion sites", systemImage: "plus.circle").foregroundStyle(.red)
                    Label("Blue −: mobile representative electrons", systemImage: "minus.circle").foregroundStyle(.blue)
                    Text("The stand is insulating. A separate wire makes the earth connection. Distances and charge motion are exaggerated for teaching; this is a qualitative model, not a calibrated electrostatic solver.")
                }
                Section("Privacy") { Text("Camera frames are processed by ARKit on your device. The app contains no analytics, accounts, networking, or camera recording.") }
            }.navigationTitle("Charge Lab guide").navigationBarTitleDisplayMode(.inline)
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { guide = false } } }
        }
    }
}
