// A tiny, copy-pasteable PalembangSwiftUI example — not an app, not an
// Xcode project. See packages/swift/README-SwiftUI.md for how to add
// PalembangSwiftUI to a Swift package or Xcode project.
//
// PalembangView adopts whatever size SwiftUI proposes, so it composes
// normally with .frame/.aspectRatio and redraws correctly on resize —
// nothing here is a fixed-size asset.

import SwiftUI
import PalembangSwiftUI

/// Wide (~16:9), square, and small-square (320-style) layouts side by side.
struct DemoView: View {
    var body: some View {
        VStack(spacing: 16) {
            PalembangView()
                .aspectRatio(16 / 9, contentMode: .fit)

            PalembangView()
                .aspectRatio(1, contentMode: .fit)

            PalembangView()
                .frame(width: 320, height: 320) // exercises the canonical 320x320 haze exception
        }
    }
}

/// Palette override example, matching PalembangKit's own palette contract
/// (PalembangPaletteToken) — only the six scene-color roles are
/// customizable; geometry and transforms stay canonical.
struct PaletteDemoView: View {
    var body: some View {
        PalembangView(
            palette: [
                .skyHot: "#D97706",
                .seaGlow: "#22D3EE",
            ]
        )
        .aspectRatio(16 / 9, contentMode: .fit)
    }
}

// A source-level preview, guarded so it only ever compiles under Xcode's own
// preview infrastructure — this file adds no Xcode project of its own.
#if DEBUG
#Preview {
    DemoView()
}

#Preview("Palette override") {
    PaletteDemoView()
}
#endif
