// swift-tools-version: 5.9
import PackageDescription
let package = Package(name: "ChargePhysics", products: [.library(name: "ChargePhysics", targets: ["ChargePhysics"])], targets: [.target(name: "ChargePhysics"), .testTarget(name: "ChargePhysicsTests", dependencies: ["ChargePhysics"])])
