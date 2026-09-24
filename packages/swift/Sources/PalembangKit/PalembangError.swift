/// The single error type `Palembang.renderSVG` can throw.
///
/// `.renderingFailed` is a defensive, should-never-happen case (e.g. an
/// internally malformed gradient transform); every other case corresponds to
/// a documented, predictable invalid-input condition callers should expect
/// to handle.
public enum PalembangError: Error, Equatable, Sendable, CustomStringConvertible {
    case invalidWidth(Double)
    case invalidHeight(Double)
    case invalidColor(token: PalembangPaletteToken, value: String)
    case invalidHazeMiddleAlpha(Double)
    case renderingFailed(String)

    public var description: String {
        switch self {
        case .invalidWidth(let value):
            return "PalembangKit: width must be a finite positive number (got \(value))"
        case .invalidHeight(let value):
            return "PalembangKit: height must be a finite positive number (got \(value))"
        case .invalidColor(let token, let value):
            return "PalembangKit: \(token.rawValue) must be a #RRGGBB color (got \"\(value)\")"
        case .invalidHazeMiddleAlpha(let value):
            return "PalembangKit: hazeMiddleAlpha must be a finite number from 0 to 1 (got \(value))"
        case .renderingFailed(let message):
            return "PalembangKit: rendering failed (\(message))"
        }
    }
}
