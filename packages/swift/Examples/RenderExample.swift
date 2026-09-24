// A tiny, copy-pasteable PalembangKit example — not an app, not an Xcode
// project. See packages/swift/README.md for how to add PalembangKit to a
// Swift package or Xcode project.

import Foundation
import PalembangKit

let svg = try Palembang.renderSVG(width: 1920, height: 1080)
print(svg)

// Writing the result to a file is ordinary Foundation file I/O done by this
// example, not by PalembangKit itself — the package performs no filesystem
// access on its own.
let outputURL = URL(fileURLWithPath: "palembang.svg")
try svg.write(to: outputURL, atomically: true, encoding: .utf8)
