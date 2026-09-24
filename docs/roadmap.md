# Roadmap

This roadmap describes where Palembang is going and, just as importantly,
where it deliberately isn't. It is a durable planning document, not a
feature backlog — see [Roadmap principles](#roadmap-principles) for how it's
meant to be maintained.

## Project direction

Palembang is a **portable graphic system and rendering toolkit**: a
canonical specification and token set, plus verified renderers and SDKs
that reconstruct the same design from those tokens on any platform.

It is **not primarily a standalone application**. The system's value is in
the canonical geometry, the reference renderer, and the packages/SDKs built
on top of it — the things other projects embed, install, or render from. A
standalone app may exist later as an optional reference or integration
example (see [Post-1.0 directions](#post-1.0-directions)), but it is not
part of what Palembang 1.0 is required to ship.

## Completed milestones

- **v0.1 — Canonical Design** — preserved Figma source, extracted design
  data, the canonical specification, v1 design tokens, and reference
  photographs; defined the licensing and integrity foundation.
- **v0.2 — Verified SVG Renderer** — the dependency-light Python SVG
  reference renderer, token-driven reconstruction for arbitrary dimensions,
  the four canonical PNG assets and their manifest, and the public-use
  licensing model (MIT / CC BY 4.0 / all-rights-reserved).
- **v0.3 — Web Playground** — the first browser-based interactive release:
  a dependency-free static Playground with live palette editing, Standard /
  Custom / Wallpaper workflows, and SVG/PNG export, deployed to GitHub
  Pages.
- **v0.4 — Shareable Palembang** — versioned shareable URL state, a curated
  palette gallery, multiple named saved designs, and `.palembang.json`
  design export/import, all still fully static and backend-free.
- **v0.5 — Developer SDK** — `@palembang/core`, a dependency-free
  JavaScript rendering SDK, so Palembang can be rendered directly from
  JavaScript applications.
- **v0.6 — CLI & Automation** — the official `@palembang/cli` package with
  `palembang render`, built on `@palembang/core`, for terminal, SSH,
  shell-script, and CI use.
- **v0.7 — PalembangKit Swift SDK Foundation** — the root SwiftPM package
  and `PalembangKit` library: canonical SVG rendering from Swift, a typed
  palette API, and verified Core↔Swift byte parity.
- **v0.8 — PalembangSwiftUI / Apple Native Presentation** — the
  `PalembangSwiftUI` library and `PalembangView`, native Core Graphics
  rendering on top of `PalembangKit` with no WebKit or bitmap stretching.

## v0.9 — Integrations & Distribution

**Purpose:** make Palembang easier to install, embed, automate, and use
from real projects — closing gaps in the paths that already exist
(SwiftPM, npm, CLI, reference renderer) rather than adding new rendering
surfaces.

**Intended goals:**

- Improve SwiftPM integration quality (documentation, examples, and
  integration friction for consumers of `PalembangKit`/`PalembangSwiftUI`).
- Improve the CLI distribution/install experience for `@palembang/cli`.
- Add automation and CI/CD integration examples showing Palembang rendered
  as part of a build or pipeline.

**Optional candidates** (may be included if they prove justified, not
promised as milestone requirements):

- Apple Shortcuts / App Intents integration, where justified by real usage.
- Additional embedding examples for common web/tool contexts.
- Distribution improvements such as a Homebrew formula, if justified by
  demand.

v0.9 does not add a standalone application requirement.

## v1.0 — Stable Palembang Toolchain

v1.0 is primarily a **stability milestone**, not a large new feature
release. It marks the point at which the canonical contract, public APIs,
and distribution channels are ready to be depended on without expecting
breaking changes outside SemVer.

**Focus areas:**

- Canonical contract stability — the specification, tokens, and geometry
  invariants are considered settled for 1.x.
- Public API stability across `@palembang/core`, `@palembang/cli`,
  `PalembangKit`, and `PalembangSwiftUI`.
- Cross-implementation consistency — continued verified parity between the
  Python, JavaScript, and Swift renderers.
- Reliable distribution across npm and SwiftPM.
- Documentation completeness for every shipped package and renderer.
- Clear SemVer expectations for consumers going forward.
- Stable, reusable integration paths for embedding Palembang in other
  projects.

A standalone iPhone/macOS app is **not** a v1.0 requirement.

## Post-1.0 directions

Kept intentionally flexible; nothing here carries a version commitment
unless a concrete need makes one necessary.

- Deeper automation and CI/CD tooling.
- Design-tool integrations, such as Figma.
- Further Apple ecosystem integrations.
- Additional native platform implementations, only when justified by real
  use rather than completeness.
- Improved embedding/component workflows for host applications.
- A standalone reference/integration app, if a concrete use case justifies
  one — as an example built on the toolchain, not a redefinition of it.

## Non-goals / scope boundaries

- Palembang is not primarily an end-user standalone application.
- A standalone iPhone/macOS app is not required for v1.0.
- New platform implementations should not be added merely for completeness
  — each one needs a real, justified use.
- Canonical geometry must not diverge between adapters/renderers.
- Protected original/canonical assets (`reference/`, `source/Palembang.fig`,
  `source/extracted/`, `assets/canonical/`) must not become runtime
  dependencies of any renderer or package.
- Roadmap items must never override the project's provenance, privacy, or
  licensing constraints — see `AGENTS.md` and `VISUAL-LICENSE.md`.

## Roadmap principles

- This document reflects intent, not a guarantee — items marked optional
  or speculative may not ship.
- Completed milestones are recorded here for orientation; `CHANGELOG.md`
  remains the authoritative release history.
- Canonical invariants (see `AGENTS.md`) take precedence over any roadmap
  item; a roadmap goal is never a reason to relax them.
- Update this document when milestone scope changes, not when individual
  tasks are completed.
