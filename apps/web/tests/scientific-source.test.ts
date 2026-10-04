import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  IMAGE_FALLBACK_SUGGESTION,
  classifySource,
  classifyTex,
  katexSettings,
  mathRenderSource,
  renderMathBlock,
  renderTex,
  tokenizeTextSource,
  unsupportedKind,
  type MathRenderResult,
  type SourceFailureCode,
  type UnsupportedKind,
} from "../src/features/questions/lib/scientific-source.ts";

function rawJoin(source: string): string {
  return tokenizeTextSource(source).map((segment) => segment.raw).join("");
}

function assertFailure(result: MathRenderResult, code: SourceFailureCode) {
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.equal(result.code, code);
  assert.equal(result.message.length > 0, true);
  assert.equal("html" in result, false);
}

function assertHtml(result: MathRenderResult): string {
  assert.equal(result.ok, true);
  if (!result.ok) return "";
  return result.html;
}

describe("scientific source delimiters", () => {
  it("preserves source slices and turns escaped dollars into literal dollars", () => {
    const source = "Giá \\$5 và \\$10, còn \\(E=mc^{2}\\).";
    const segments = tokenizeTextSource(source);
    assert.equal(rawJoin(source), source);
    assert.equal(segments.length, 3);
    assert.deepEqual(segments[0], {
      kind: "text",
      raw: "Giá \\$5 và \\$10, còn ",
      text: "Giá $5 và $10, còn ",
    });
    assert.deepEqual(segments[1], {
      kind: "math",
      raw: "\\(E=mc^{2}\\)",
      tex: "E=mc^{2}",
      display: false,
    });
    assert.deepEqual(segments[2], { kind: "text", raw: ".", text: "." });
  });

  it("keeps currency, word-adjacent dollars, and malformed dollars as text", () => {
    for (const source of ["US$5 và $10.", "$5 và $10", "a$x$", "đ$x$", "Bắt đầu $x", "$x$2", "$x\ny$"]) {
      const segments = tokenizeTextSource(source);
      assert.equal(rawJoin(source), source);
      assert.equal(segments.length, 1);
      assert.equal(segments[0]?.kind, "text");
    }
  });

  it("tokenizes explicit inline and display delimiters without rewriting them", () => {
    const source = "\\(a\\) và \\[b\\] rồi $$c$$ cuối $d$";
    const segments = tokenizeTextSource(source);
    assert.equal(rawJoin(source), source);
    assert.deepEqual(
      segments.map((segment) => (segment.kind === "math" ? [segment.tex, segment.display] : segment.text)),
      [
        ["a", false],
        " và ",
        ["b", true],
        " rồi ",
        ["c", true],
        " cuối ",
        ["d", false],
      ],
    );
  });

  it("pairs separate inline dollars and keeps math escapes inside the formula", () => {
    const paired = "$x$ and $y$";
    assert.equal(rawJoin(paired), paired);
    assert.deepEqual(
      tokenizeTextSource(paired).map((segment) => (segment.kind === "math" ? segment.tex : segment.text)),
      ["x", " and ", "y"],
    );
    const escaped = "\\(a\\$b\\)";
    const math = tokenizeTextSource(escaped)[0];
    assert.equal(math?.kind, "math");
    if (math?.kind === "math") assert.equal(math.tex, "a\\$b");
  });

  it("treats an escaped backslash before a parenthesis as text", () => {
    const source = "\\\\(not math)";
    const segments = tokenizeTextSource(source);
    assert.equal(segments.length, 1);
    assert.equal(segments[0]?.kind, "text");
    if (segments[0]?.kind === "text") assert.equal(segments[0].text, "\\(not math)");
  });

  it("emits one text segment for a long escaped-dollar prefix", () => {
    const source = "Giá \\$5 ".repeat(100);
    const segments = tokenizeTextSource(source);
    assert.equal(segments.length, 1);
    assert.equal(segments[0]?.kind, "text");
    if (segments[0]?.kind === "text") {
      assert.equal(segments[0].raw, source);
      assert.equal(segments[0].text.includes("\\"), false);
    }
  });

  it("strips one outer math-block pair only for the render call", () => {
    const source = "$$\\frac{1}{2}$$";
    assert.deepEqual(mathRenderSource(source), { tex: "\\frac{1}{2}", delimiterDisplay: true });
    assert.equal(source, "$$\\frac{1}{2}$$");
    assert.equal(assertHtml(renderMathBlock(source, false)).includes("katex-display"), false);
    assert.equal(assertHtml(renderMathBlock("\\(x\\)", true)).includes("katex-display"), true);
    assert.equal(mathRenderSource("\\$x\\$").tex, "\\$x\\$");
    assert.deepEqual(tokenizeTextSource("$$$$"), [
      { kind: "math", raw: "$$$$", tex: "", display: true },
    ]);
  });
});

describe("scientific source safety", () => {
  const unsupportedSamples: Array<[string, UnsupportedKind]> = [
    ["\\documentclass{article}", "document"],
    ["\\usepackage{tikz}", "document"],
    ["\\begin{document}x\\end{document}", "document"],
    ["\\input{secret.tex}", "input"],
    ["\\include{chapter}", "include"],
    ["\\begin{tikzpicture}\\draw (0,0);\\end{tikzpicture}", "tikz"],
    ["\\usetikzlibrary{arrows}", "tikz"],
    ["\\pgfpathmoveto{\\pgfpoint{0}{0}}", "pgf"],
    ["\\begin{pgfpicture}\\end{pgfpicture}", "pgf"],
    ["\\begin{circuitikz}\\draw (0,0) to (1,1);\\end{circuitikz}", "circuitikz"],
    ["\\chemfig{A-B}", "chemfig"],
    ["\\begin {picture}(10,10)\\put(0,0){\\circle{1}}\\end{picture}", "picture"],
  ];

  it("rejects full documents and graphics packages before KaTeX runs", () => {
    for (const [source, code] of unsupportedSamples) {
      assert.equal(unsupportedKind(source), code);
      const copy = source;
      assertFailure(renderMathBlock(source, true), code);
      assert.equal(source, copy);
    }
  });

  it("does not treat escaped input or ordinary math commands as package commands", () => {
    for (const source of ["\\ce{H2O}", "\\frac{1}{2}", "\\times", "\\\\input{a}", "\\\\href{https://example.com}{x}"]) {
      assert.equal(unsupportedKind(source), null);
    }
  });

  it("flags a full document or external command in plain text and keeps that source", () => {
    const prose = "Lời giải.\\documentclass{article} hết.";
    const documentDecision = classifySource(prose);
    assert.equal(documentDecision.ok, false);
    if (!documentDecision.ok) assert.equal(documentDecision.code, "document");
    assert.equal(rawJoin(prose), prose);
    const linked = "Xem \\href{https://example.com}{đây}.";
    const linkDecision = classifySource(linked);
    assert.equal(linkDecision.ok, false);
    if (!linkDecision.ok) assert.equal(linkDecision.code, "external");
    assert.equal(linked, "Xem \\href{https://example.com}{đây}.");
  });

  it("reports malformed TeX and over-long source without dropping the source", () => {
    const broken = "\\frac{1}";
    assertFailure(renderTex(broken, false), "katex");
    assert.equal(broken, "\\frac{1}");
    assertFailure(classifyTex("x".repeat(16001)), "too_long");
    assert.equal(classifyTex("x".repeat(16000)).ok, true);
    assert.match(IMAGE_FALLBACK_SUGGESTION, /ảnh/);
  });
});

describe("scientific math and chemistry rendering", () => {
  it("renders broad math and mhchem from a fresh trusted-off configuration", () => {
    const first = katexSettings(false);
    const second = katexSettings(true);
    assert.notEqual(first.macros, second.macros);
    assert.equal(first.trust, false);
    assert.equal(first.throwOnError, true);
    assert.equal(first.maxExpand, 1000);
    assert.equal(first.maxSize, 20);
    assert.equal(first.globalGroup, false);
    assert.equal(second.displayMode, true);

    const fraction = assertHtml(renderTex("\\frac{1}{2}", false));
    assert.equal(fraction.includes("katex"), true);
    assert.equal(fraction.includes("1"), true);
    assert.equal(fraction.includes("2"), true);
    assert.equal(renderTex("\\sqrt{x^{2}+1}", false).ok, true);
    assert.equal(renderTex("\\int_{0}^{1} x\\,dx", true).ok, true);

    const water = assertHtml(renderTex("\\ce{H2O}", false));
    assert.equal(water.includes("H"), true);
    assert.equal(water.includes("O"), true);
    const energy = assertHtml(renderTex("\\pu{1.2 kJ}", false));
    assert.equal(energy.includes("J"), true);
  });

  it("blocks trust escapes, expansion loops, and persistent definitions", () => {
    for (const source of [
      "\\href{https://example.com}{x}",
      "\\url{https://example.com}",
      "\\includegraphics{a.png}",
      "\\htmlData{foo=bar}",
      "\\htmlStyle{color:red}",
    ]) {
      assert.equal(unsupportedKind(source), "external");
      const result = renderTex(source, false);
      if (result.ok) {
        assert.equal(/<a\b/i.test(result.html), false);
        assert.equal(/<img\b/i.test(result.html), false);
      } else {
        assert.equal(result.code, "external");
        assert.equal("html" in result, false);
      }
    }
    assertFailure(renderTex("\\def\\a{\\a}\\a", false), "katex");

    const defined = renderMathBlock("\\gdef\\keep{4}\\keep", false);
    assert.equal(defined.ok, true);
    assertFailure(renderMathBlock("\\keep", false), "katex");

    assert.equal(renderMathBlock("\\gdef\\ce{NO}", false).ok, true);
    const water = assertHtml(renderMathBlock("\\ce{H2O}", false));
    assert.equal(water.includes("H"), true);
    assert.equal(water.includes("O"), true);

    const rule = assertHtml(renderTex("\\rule{100em}{1em}", false));
    const annotationAt = rule.indexOf('<annotation encoding="application/x-tex">');
    const annotationEnd = rule.indexOf("</annotation>", annotationAt);
    assert.equal(annotationAt >= 0 && annotationEnd > annotationAt, true);
    assert.equal(rule.slice(annotationAt, annotationEnd).includes("\\rule{100em}{1em}"), true);
    const viewAt = rule.indexOf('class="katex-html"');
    assert.equal(viewAt > annotationEnd, true);
    const view = rule.slice(viewAt);
    assert.equal(view.includes("100em"), false);
    const marker = 'class="mord katex-rule" style="';
    const styleAt = view.indexOf(marker);
    assert.equal(styleAt >= 0, true);
    const styleStart = styleAt + marker.length;
    const style = view.slice(styleStart, view.indexOf('"', styleStart));
    const width = /border-right-width:([0-9.]+)em/.exec(style);
    const height = /border-top-width:([0-9.]+)em/.exec(style);
    assert.equal(width !== null && height !== null, true);
    const widthEm = Number(width?.[1]);
    const heightEm = Number(height?.[1]);
    assert.equal(widthEm, 20);
    assert.equal(widthEm <= 20, true);
    assert.equal(heightEm, 1);
    assert.equal(heightEm <= 20, true);
  });
});
