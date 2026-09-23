# Palembang CLI

`@palembang/cli` is the official command-line interface for rendering
Palembang SVGs in terminals, servers, shell scripts, SSH sessions, and CI.
It delegates rendering to [`@palembang/core`](../core/README.md); it does not
contain a second renderer and does not provide PNG output.

## Requirements and installation

Node.js 20 or newer is required.

```sh
npm install -g @palembang/cli
```

For a one-off invocation:

```sh
npx @palembang/cli render --size 1920x1080 > palembang.svg
```

The package is prepared as version `0.6.0` and is not published by this
implementation pass.

## Usage

Render with the convenience size syntax:

```sh
palembang render --size 1920x1080 -o palembang.svg
```

Or provide explicit dimensions:

```sh
palembang render --width 1920 --height 1080 -o palembang.svg
```

`--size` cannot be combined with either explicit dimension option. Dimensions
must be finite positive numbers.

When `--output`/`-o` is omitted, the command writes only the UTF-8 SVG to
stdout, so redirection is safe:

```sh
palembang render --size 1920x1080 > palembang.svg
```

With a file output path, parent directories are created automatically and an
existing file is overwritten without prompting. No command mode is
interactive.

## Palette and attribution

The six supported scene-token overrides are repeatable:

```sh
palembang render \
  --size 1920x1080 \
  --color sky.hot=#D97706 \
  --color sky.cool=#64748B \
  -o custom.svg
```

Supported tokens are `sky.hot`, `sky.cool`, `sea.light`, `sea.dark`,
`sea.haze`, and `sea.glow`. Values must be six-digit `#RRGGBB` colors.

Attribution metadata is included by default. `--no-attribution` removes only
the embedded SVG metadata; it does not remove the user's CC BY 4.0 attribution
obligation. See [`VISUAL-LICENSE.md`](../../VISUAL-LICENSE.md).

`--haze-middle-alpha NUMBER` exposes the existing core option and accepts a
value from `0` through `1`.

## Automation behavior

Successful SVG output goes to stdout only when no output path is given.
Diagnostics and errors go to stderr. Success exits with `0`; invalid command
input exits non-zero. The command has no GUI, browser, DOM, prompt, config
file, or shell execution dependency.

The CLI package's only runtime dependency is `@palembang/core` (`^0.5.0`).
JavaScript applications should use `@palembang/core` directly; shell users
should use this executable boundary.

The CLI code is MIT-licensed. Generated Palembang SVG output is covered by
the repository's CC BY 4.0 terms and requires attribution. See
[`LICENSE.md`](LICENSE.md) and [`VISUAL-LICENSE.md`](../../VISUAL-LICENSE.md).
