import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const indexSource = fs.readFileSync(`${root}/index.html`, 'utf8');
const appSource = fs.readFileSync(`${root}/journal-app.js`, 'utf8');

const marker = 'window.OPERATORS_BRIDGE_SOURCE = String.raw`';
const bridgeStart = indexSource.lastIndexOf(marker);
assert.notEqual(bridgeStart, -1, 'authenticated journal bridge was not found');
const sourceStart = bridgeStart + marker.length;
const sourceEnd = indexSource.indexOf('\n`;', sourceStart);
assert.notEqual(sourceEnd, -1, 'authenticated journal bridge was not terminated');
const bridgeSource = indexSource.slice(sourceStart, sourceEnd);

const authorizations = [];
let refreshCount = 0;
const context = {
  URLSearchParams,
  encodeURIComponent,
  console,
  window: {
    __OPERATORS_API_BASE: 'https://database.example',
    __OPERATORS_SESSION: { token: 'expired-token', user: { email: 'trader@example.com' } },
    __OPERATORS_REFRESH_SESSION: async () => {
      refreshCount += 1;
      return { token: 'renewed-token', user: { email: 'trader@example.com' } };
    },
    __OPERATORS_SAVE_SESSION: () => {},
  },
  fetch: async (_url, options) => {
    authorizations.push(options.headers.Authorization);
    const ok = options.headers.Authorization === 'Bearer renewed-token';
    return { ok, status: ok ? 200 : 401, json: async () => ok ? { saved: true } : { message: 'Please sign in again.' } };
  },
};
context.window.window = context.window;
vm.createContext(context);
await vm.runInContext(bridgeSource, context);
await context.window.storage.set('aurum_journal_data', '{"trades":[]}');

assert.equal(refreshCount, 1, 'a 401 should refresh exactly once');
assert.deepEqual(authorizations, ['Bearer expired-token', 'Bearer renewed-token']);

assert.match(appSource, /OPERATORS_JOURNAL_PENDING_STORAGE_KEY/);
assert.match(appSource, /localStorage\.setItem\(OPERATORS_JOURNAL_PENDING_STORAGE_KEY/);
assert.match(appSource, /if\(latest&&latest\.nonce===pending\.nonce\)localStorage\.removeItem\(OPERATORS_JOURNAL_PENDING_STORAGE_KEY\)/);
assert.match(appSource, /recoveredPendingCloudState=true/);

console.log('Cloud sync recovery regression tests passed.');
