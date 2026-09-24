// swift-tools-version:5.9
// PalembangKit — canonical Swift SDK for the Palembang Graphic System.
//
// This manifest lives at the repository root (not under packages/swift/)
// because Swift Package Manager's Git-dependency resolution expects
// Package.swift at the repository root. Swift sources, tests, and examples
// stay under packages/swift/ alongside the JS packages in packages/core and
// packages/cli, so the repository layout is otherwise unchanged.
import PackageDescription

let package = Package(
    name: "PalembangKit",
    platforms: [
        .macOS(.v12),
        .iOS(.v15),
    ],
    products: [
        .library(name: "PalembangKit", targets: ["PalembangKit"]),
        .library(name: "PalembangSwiftUI", targets: ["PalembangSwiftUI"]),
    ],
    targets: [
        .target(
            name: "PalembangKit",
            path: "packages/swift/Sources/PalembangKit"
        ),
        .target(
            name: "PalembangSwiftUI",
            dependencies: ["PalembangKit"],
            path: "packages/swift/Sources/PalembangSwiftUI"
        ),
        .testTarget(
            name: "PalembangKitTests",
            dependencies: ["PalembangKit"],
            path: "packages/swift/Tests/PalembangKitTests"
        ),
        .testTarget(
            name: "PalembangSwiftUITests",
            dependencies: ["PalembangKit", "PalembangSwiftUI"],
            path: "packages/swift/Tests/PalembangSwiftUITests"
        ),
    ]
)
