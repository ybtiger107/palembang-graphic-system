import { parseArgs as nodeParseArgs } from "node:util";

const NUMBER_PATTERN = /^[+]?((\d+(\.\d*)?)|(\.\d+))(e[+-]?\d+)?$/i;

const OPTIONS = {
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
  size: { type: "string" },
  width: { type: "string" },
  height: { type: "string" },
  output: { type: "string", short: "o" },
  color: { type: "string", multiple: true },
  "no-attribution": { type: "boolean" },
  "haze-middle-alpha": { type: "string" },
};

export class CliUsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "CliUsageError";
  }
}

function parseNumber(raw, label, { allowZero = false } = {}) {
  if (typeof raw !== "string" || !NUMBER_PATTERN.test(raw)) {
    throw new CliUsageError(`${label} must be a finite positive number`);
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || (allowZero ? value < 0 : value <= 0)) {
    throw new CliUsageError(`${label} must be a finite ${allowZero ? "non-negative" : "positive"} number`);
  }
  return value;
}

function parseSize(raw) {
  if (typeof raw !== "string") {
    throw new CliUsageError("--size must use WIDTHxHEIGHT, for example 1920x1080");
  }
  const parts = raw.split("x");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new CliUsageError("--size must use WIDTHxHEIGHT, for example 1920x1080");
  }
  return {
    width: parseNumber(parts[0], "width"),
    height: parseNumber(parts[1], "height"),
  };
}

function parsePalette(colors, supportedTokens) {
  const palette = {};
  for (const raw of colors ?? []) {
    const separator = raw.indexOf("=");
    if (separator <= 0) {
      throw new CliUsageError("--color must use TOKEN=#RRGGBB");
    }
    const token = raw.slice(0, separator);
    const value = raw.slice(separator + 1);
    if (!supportedTokens.includes(token)) {
      throw new CliUsageError(`unknown palette token "${token}"`);
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) {
      throw new CliUsageError(`color for "${token}" must be a #RRGGBB color`);
    }
    palette[token] = value;
  }
  return palette;
}

function parseNodeArgs(argv) {
  try {
    return nodeParseArgs({ args: argv, options: OPTIONS, allowPositionals: true });
  } catch (error) {
    if (error.code === "ERR_PARSE_ARGS_UNKNOWN_OPTION") {
      const unknown = argv.find((token) => {
        if (!token.startsWith("-") || token === "-") return false;
        const name = token.startsWith("--") ? token.slice(2).split("=", 1)[0] : token.slice(1, 2);
        return !(name in OPTIONS) && !["h", "v", "o"].includes(name);
      });
      throw new CliUsageError(`unknown option "${unknown?.split("=", 1)[0] ?? "?"}"`);
    }
    throw new CliUsageError(error.message.replace(/^Unknown option '\S+'\.?\s*/i, "unknown option: "));
  }
}

export function parseCli(argv, supportedTokens) {
  const { values, positionals } = parseNodeArgs(argv);
  if (positionals.length > 1 || (positionals.length === 1 && positionals[0] !== "render")) {
    throw new CliUsageError(`unknown command "${positionals[0]}"`);
  }

  const command = positionals[0] ?? null;
  if (!command) {
    return { command: null, help: values.help === true, version: values.version === true };
  }
  if (values.version) {
    return { command, version: true };
  }
  if (values.help) {
    return { command, help: true };
  }

  const hasSize = values.size !== undefined;
  const hasWidth = values.width !== undefined;
  const hasHeight = values.height !== undefined;
  if (hasSize && (hasWidth || hasHeight)) {
    throw new CliUsageError("--size cannot be combined with --width or --height");
  }

  let dimensions;
  if (hasSize) {
    dimensions = parseSize(values.size);
  } else if (hasWidth || hasHeight) {
    if (!hasWidth || !hasHeight) {
      throw new CliUsageError("--width and --height must be provided together");
    }
    dimensions = {
      width: parseNumber(values.width, "width"),
      height: parseNumber(values.height, "height"),
    };
  } else {
    throw new CliUsageError("render requires --size WIDTHxHEIGHT or both --width and --height");
  }

  let hazeMiddleAlpha;
  if (values["haze-middle-alpha"] !== undefined) {
    hazeMiddleAlpha = parseNumber(values["haze-middle-alpha"], "--haze-middle-alpha", { allowZero: true });
    if (hazeMiddleAlpha > 1) {
      throw new CliUsageError("--haze-middle-alpha must be a finite number from 0 to 1");
    }
  }

  return {
    command,
    width: dimensions.width,
    height: dimensions.height,
    output: values.output,
    palette: parsePalette(values.color, supportedTokens),
    attribution: values["no-attribution"] ? false : undefined,
    hazeMiddleAlpha,
  };
}

export const helpOptionNames = Object.freeze(Object.keys(OPTIONS));
