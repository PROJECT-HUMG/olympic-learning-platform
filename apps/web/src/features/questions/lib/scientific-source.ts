import katex, { type KatexOptions } from "katex";
import "katex/contrib/mhchem";

/**
 * Delimiters are resolved only for rendering. Stored source is never rewritten.
 * \$ is a literal dollar and \\ is a literal backslash. \[...\] and $$...$$ are display;
 * \(...\) is inline. $...$ is inline only when the opener is not after a letter or digit,
 * neither edge of the inner text is whitespace, the inner text has no line break, and the
 * closer is not before a digit. The nearest valid closer wins. An opener without one stays text.
 * Scans are linear: text is sliced once, closers are sought only at openers, and a failed
 * \[ \(\ or $$ is not scanned again. A failed $ is not scanned again until the next line or the end.
 * One outer math-block delimiter pair is removed only for the KaTeX call. MathBlock.display
 * chooses inline or display layout. Each call uses a new macros object.
 */

export const MAX_SOURCE_LENGTH = 16000;

export const IMAGE_FALLBACK_SUGGESTION =
  "Hãy giữ nguyên nguồn và tải một ảnh thay thế.";

export type UnsupportedKind =
  | "document"
  | "input"
  | "include"
  | "tikz"
  | "pgf"
  | "circuitikz"
  | "chemfig"
  | "picture"
  | "external";

export type SourceFailureCode = "too_long" | "katex" | UnsupportedKind;

export type TextSegment =
  | { kind: "text"; raw: string; text: string }
  | { kind: "math"; raw: string; tex: string; display: boolean };

export type SourceFailureResult = {
  ok: false;
  code: SourceFailureCode;
  message: string;
};

export type MathDecision = { ok: true; tex: string } | SourceFailureResult;

export type MathRenderResult = { ok: true; html: string } | SourceFailureResult;

interface Match {
  end: number;
  innerStart: number;
  innerEnd: number;
  display: boolean;
}

interface ScanFlags {
  bracketDead: boolean;
  parenDead: boolean;
  displayDollarDead: boolean;
  dollarDeadUntil: number;
}

const UNSUPPORTED_MESSAGE: Record<UnsupportedKind, string> = {
  document: "Không hỗ trợ tài liệu TeX đầy đủ.",
  input: "Không hỗ trợ lệnh \\input.",
  include: "Không hỗ trợ lệnh \\include.",
  tikz: "Không hỗ trợ TikZ.",
  pgf: "Không hỗ trợ PGF.",
  circuitikz: "Không hỗ trợ circuitikz.",
  chemfig: "Không hỗ trợ chemfig.",
  picture: "Không hỗ trợ môi trường picture.",
  external: "Không hỗ trợ lệnh liên kết hoặc nhúng ngoài.",
};

const COMMAND_KIND: Record<string, UnsupportedKind> = {
  documentclass: "document",
  usepackage: "document",
  documentstyle: "document",
  input: "input",
  include: "include",
  tikz: "tikz",
  tikzset: "tikz",
  usetikzlibrary: "tikz",
  pgf: "pgf",
  usepgfmodule: "pgf",
  usepgflibrary: "pgf",
  circuitikz: "circuitikz",
  chemfig: "chemfig",
  href: "external",
  url: "external",
  includegraphics: "external",
};

const ENVIRONMENT_KIND: Record<string, UnsupportedKind> = {
  document: "document",
  tikzpicture: "tikz",
  pgfpicture: "pgf",
  circuitikz: "circuitikz",
  chemfig: "chemfig",
  picture: "picture",
};

function failure(code: SourceFailureCode, message: string): SourceFailureResult {
  return { ok: false, code, message };
}

function literalText(raw: string): string {
  let text = "";
  for (let index = 0; index < raw.length; index += 1) {
    const next = raw[index + 1];
    if (raw[index] === "\\" && (next === "\\" || next === "$")) {
      text += next;
      index += 1;
      continue;
    }
    text += raw[index];
  }
  return text;
}

function findUnescaped(source: string, from: number, closer: string): number {
  let index = from;
  while (index < source.length) {
    if (source[index] !== "\\") {
      if (!closer.startsWith("\\") && source.startsWith(closer, index)) return index;
      index += 1;
      continue;
    }
    let run = 0;
    while (source[index + run] === "\\") run += 1;
    if (run % 2 === 1) {
      const commandAt = index + run - 1;
      if (closer.startsWith("\\") && source.startsWith(closer, commandAt)) return commandAt;
      index = Math.min(source.length, index + run + 1);
      continue;
    }
    index += run;
  }
  return -1;
}

function validInlineDollar(source: string, open: number, close: number): boolean {
  const previous = open > 0 ? source[open - 1] : "";
  if (previous && /[\p{L}\p{N}]/u.test(previous)) return false;
  const inner = source.slice(open + 1, close);
  if (inner.length === 0 || inner.includes("\n") || inner.includes("\r")) return false;
  if (/\s/.test(inner[0] ?? "") || /\s/.test(inner[inner.length - 1] ?? "")) return false;
  const after = source[close + 1];
  return after === undefined || !/\p{N}/u.test(after);
}

function findInlineDollar(source: string, open: number): { close: number } | { deadUntil: number } {
  let index = open + 1;
  while (index < source.length) {
    const current = source[index] ?? "";
    if (current === "\n" || current === "\r") return { deadUntil: index + 1 };
    if (current !== "\\") {
      if (current === "$" && validInlineDollar(source, open, index)) return { close: index };
      index += 1;
      continue;
    }
    let run = 0;
    while (source[index + run] === "\\") run += 1;
    index = run % 2 === 1 ? Math.min(source.length, index + run + 1) : index + run;
  }
  return { deadUntil: source.length };
}

function matchWrapped(
  source: string,
  index: number,
  open: string,
  close: string,
  display: boolean,
  dead: "bracketDead" | "parenDead",
  flags: ScanFlags,
): Match | null {
  if (flags[dead] || !source.startsWith(open, index)) return null;
  const closeAt = findUnescaped(source, index + open.length, close);
  if (closeAt === -1) {
    flags[dead] = true;
    return null;
  }
  return { end: closeAt + close.length, innerStart: index + open.length, innerEnd: closeAt, display };
}

function matchDisplayDollar(source: string, index: number, flags: ScanFlags): Match | null {
  if (flags.displayDollarDead || !source.startsWith("$$", index)) return null;
  const closeAt = findUnescaped(source, index + 2, "$$");
  if (closeAt === -1) {
    flags.displayDollarDead = true;
    return null;
  }
  return { end: closeAt + 2, innerStart: index + 2, innerEnd: closeAt, display: true };
}

function matchDollar(source: string, index: number, flags: ScanFlags): Match | null {
  if (index < flags.dollarDeadUntil || source[index] !== "$") return null;
  const previous = index > 0 ? source[index - 1] : "";
  if (previous && /[\p{L}\p{N}]/u.test(previous)) return null;
  const next = source[index + 1];
  if (next === undefined || /\s/.test(next)) return null;
  const found = findInlineDollar(source, index);
  if ("deadUntil" in found) {
    flags.dollarDeadUntil = Math.max(flags.dollarDeadUntil, found.deadUntil);
    return null;
  }
  return { end: found.close + 1, innerStart: index + 1, innerEnd: found.close, display: false };
}

function matchAt(source: string, index: number, flags: ScanFlags): Match | null {
  const current = source[index];
  if (current === "\\") {
    if (source[index + 1] === "[") return matchWrapped(source, index, "\\[", "\\]", true, "bracketDead", flags);
    if (source[index + 1] === "(") return matchWrapped(source, index, "\\(", "\\)", false, "parenDead", flags);
    return null;
  }
  if (current !== "$") return null;
  const display = matchDisplayDollar(source, index, flags);
  return display ?? matchDollar(source, index, flags);
}

export function tokenizeTextSource(source: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const flags: ScanFlags = {
    bracketDead: false,
    parenDead: false,
    displayDollarDead: false,
    dollarDeadUntil: 0,
  };
  let textStart = 0;
  let index = 0;
  const emitText = (end: number) => {
    if (textStart >= end) return;
    const raw = source.slice(textStart, end);
    segments.push({ kind: "text", raw, text: literalText(raw) });
    textStart = end;
  };

  while (index < source.length) {
    if (source[index] === "\\" && (source[index + 1] === "\\" || source[index + 1] === "$")) {
      index += 2;
      continue;
    }
    const match = matchAt(source, index, flags);
    if (!match) {
      index += 1;
      continue;
    }
    emitText(index);
    segments.push({
      kind: "math",
      raw: source.slice(index, match.end),
      tex: source.slice(match.innerStart, match.innerEnd),
      display: match.display,
    });
    index = match.end;
    textStart = index;
  }
  emitText(source.length);
  return segments;
}

function isEscaped(source: string, index: number): boolean {
  let count = 0;
  for (let cursor = index - 1; cursor >= 0 && source[cursor] === "\\"; cursor -= 1) count += 1;
  return count % 2 === 1;
}

export function mathRenderSource(source: string): { tex: string; delimiterDisplay: boolean | null } {
  const pairs = [
    { open: "$$", close: "$$", display: true },
    { open: "\\[", close: "\\]", display: true },
    { open: "\\(", close: "\\)", display: false },
    { open: "$", close: "$", display: false },
  ] as const;
  for (const pair of pairs) {
    if (source.length < pair.open.length + pair.close.length) continue;
    if (!source.startsWith(pair.open) || !source.endsWith(pair.close) || isEscaped(source, 0)) continue;
    const closeAt = source.length - pair.close.length;
    if (isEscaped(source, closeAt)) continue;
    if (pair.open === "$" && (source.startsWith("$$") || source.endsWith("$$"))) continue;
    return { tex: source.slice(pair.open.length, closeAt), delimiterDisplay: pair.display };
  }
  return { tex: source, delimiterDisplay: null };
}

function commandKind(name: string): UnsupportedKind | null {
  const exact = COMMAND_KIND[name];
  if (exact) return exact;
  if (name.startsWith("html")) return "external";
  if (name.startsWith("tikz")) return "tikz";
  if (name.startsWith("pgf")) return "pgf";
  if (name.startsWith("circuitikz")) return "circuitikz";
  if (name.startsWith("chemfig")) return "chemfig";
  return null;
}

function readEnvironment(source: string, from: number): string | null {
  let index = from;
  while (index < source.length && /\s/.test(source[index] ?? "")) index += 1;
  if (source[index] !== "{") return null;
  const end = source.indexOf("}", index + 1);
  if (end === -1) return null;
  return source.slice(index + 1, end).trim();
}

export function unsupportedKind(source: string): UnsupportedKind | null {
  let index = 0;
  while (index < source.length) {
    if (source[index] !== "\\") {
      index += 1;
      continue;
    }
    const runStart = index;
    while (index < source.length && source[index] === "\\") index += 1;
    if ((index - runStart) % 2 === 0) continue;
    const nameStart = index;
    if (!/[A-Za-z]/.test(source[nameStart] ?? "")) continue;
    while (index < source.length && /[A-Za-z]/.test(source[index] ?? "")) index += 1;
    const name = source.slice(nameStart, index);
    if (name === "begin" || name === "end") {
      const environment = readEnvironment(source, index);
      if (environment && ENVIRONMENT_KIND[environment]) return ENVIRONMENT_KIND[environment];
    }
    const kind = commandKind(name);
    if (kind) return kind;
  }
  return null;
}

export function classifyTex(tex: string): MathDecision {
  const decision = classifySource(tex);
  if (!decision.ok) return decision;
  return { ok: true, tex };
}

export function classifySource(source: string): SourceFailureResult | { ok: true } {
  if (source.length > MAX_SOURCE_LENGTH) return failure("too_long", "Nguồn vượt quá 16000 ký tự.");
  const kind = unsupportedKind(source);
  if (kind) return failure(kind, UNSUPPORTED_MESSAGE[kind]);
  return { ok: true };
}

export function classifyMathBlock(source: string): MathDecision {
  const decision = classifySource(source);
  if (!decision.ok) return decision;
  return classifyTex(mathRenderSource(source).tex);
}

export function katexSettings(displayMode: boolean): KatexOptions {
  return {
    displayMode,
    throwOnError: true,
    trust: false,
    strict: "ignore",
    maxExpand: 1000,
    maxSize: 20,
    globalGroup: false,
    macros: {},
    output: "htmlAndMathml",
  };
}

function renderClassified(decision: MathDecision, display: boolean): MathRenderResult {
  if (!decision.ok) return decision;
  if (!decision.tex) return { ok: true, html: "" };
  try {
    return { ok: true, html: katex.renderToString(decision.tex, katexSettings(display)) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Không kết xuất được công thức.";
    return failure("katex", message);
  }
}

export function renderTex(tex: string, display: boolean): MathRenderResult {
  return renderClassified(classifyTex(tex), display);
}

export function renderMathBlock(source: string, display: boolean): MathRenderResult {
  return renderClassified(classifyMathBlock(source), display);
}
