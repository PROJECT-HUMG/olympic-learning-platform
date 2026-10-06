import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { fileURLToPath } from "node:url";

function nativeCalls(file: ts.SourceFile, checker: ts.TypeChecker): string[] {
  const native: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      const declaration = checker.getResolvedSignature(node)?.declaration;
      if (declaration && declaration.getSourceFile().fileName.endsWith("lib.dom.d.ts")) {
        const name = "name" in declaration ? declaration.name?.getText() : undefined;
        if (name && ["alert", "confirm", "prompt"].includes(name)) {
          const { line } = file.getLineAndCharacterOfPosition(node.getStart());
          native.push(`${file.fileName}:${line + 1}: ${node.getText()}`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return native;
}

test("application calls do not resolve to browser alert/confirm/prompt", () => {
  const root = fileURLToPath(new URL("../", import.meta.url));
  const config = ts.readConfigFile(root + "tsconfig.app.json", ts.sys.readFile);
  assert.equal(config.error, undefined);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const checker = program.getTypeChecker();
  const native: string[] = [];
  for (const file of program.getSourceFiles()) {
    if (!file.fileName.startsWith(root + "src/")) continue;
    native.push(...nativeCalls(file, checker));
  }
  assert.deepEqual(native, []);
});

test("native-call inventory detects aliases/indexed globals without flagging local confirm", () => {
  const fixture = fileURLToPath(new URL("native-prompt-fixture.ts", import.meta.url));
  const options: ts.CompilerOptions = { target: ts.ScriptTarget.ES2023, noEmit: true };
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (path, ...args) => path === fixture ? ts.createSourceFile(path, `
    alert('message'); window.confirm('question'); globalThis.prompt('entry');
    const ask = window['prompt']; ask('alias');
    const { confirm: approve } = window; approve('destructured');
    function custom() { const confirm = () => true; confirm(); }
  `, ts.ScriptTarget.ES2023, true) : original(path, ...args);
  const program = ts.createProgram([fixture], options, host);
  assert.equal(nativeCalls(program.getSourceFile(fixture)!, program.getTypeChecker()).length, 5);
});
