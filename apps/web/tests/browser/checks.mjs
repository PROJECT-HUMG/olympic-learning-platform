// Only migrated, self-hosted, intercepted-API checks belong in this entry point.
export const checks = {
  journeys: {
    file: 'project-journeys-browser-check.mjs',
    description: 'Routed topics, invitations/acceptance, document contribution and exam entries',
    options: {},
  },
  otp: {
    file: 'registration-verification-browser-check.mjs',
    description: 'Routed /register verification, shared shell and OTP interactions',
    options: { before: 'boolean', 'visual-only': 'boolean', 'interactions-only': 'boolean' },
  },
  auth: {
    file: 'auth-family-browser-check.mjs',
    description: 'Routed auth forms, recovery, reset, status and loading',
    options: { section: ['forms', 'recovery', 'reset', 'lifecycle', 'status-visuals', 'loading', 'turnstile'], 'forgot-only': 'boolean' },
  },
  home: {
    file: 'home-masked-heading-browser-check.mjs',
    description: 'Routed Home heading, motion, original videos and search',
    options: { before: 'boolean' },
  },
  media: {
    file: 'recognition-media-browser-check.mjs',
    description: 'Routed Recognition albums and private image/file evidence',
    options: { before: 'boolean', 'evidence-only': 'boolean' },
  },
};

export function usage(name) {
  const selected = name ? { [name]: checks[name] } : checks;
  return [
    'Usage: pnpm check:browser <check> [options]',
    '       pnpm check:browser --list | <check> --help',
    ...Object.entries(selected).map(([key, check]) => `${key}: ${check.description}\n  ${Object.entries(check.options).map(([flag, type]) => `--${flag}${Array.isArray(type) ? '=' + type.join('|') : ''}`).join(' ')}`),
    'Shared: --browser <executable> --output <NEW directory> --timeout-ms <milliseconds> --no-sandbox',
    'Default: installed Chromium discovery, unique /tmp evidence, 30000ms per Chromium startup/CDP call.',
    'No download, external server attachment, env-file loading or live API mode. APIs are synthetic.',
    '--before is historical comparison only, never current acceptance proof.',
  ].join('\n');
}
