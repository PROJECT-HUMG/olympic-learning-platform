import { checks, usage } from './browser/checks.mjs';

const name = process.argv[2];
if (!name || name === '--help' || name === '--list') {
  console.log(usage());
} else if (!Object.hasOwn(checks, name)) {
  console.error(`Unknown browser check: ${name}\n${usage()}`);
  process.exitCode = 1;
} else {
  // Same process: the lifecycle owner receives signals and owns all cleanup.
  process.argv.splice(2, 1);
  await import(new URL(checks[name].file, import.meta.url));
}
