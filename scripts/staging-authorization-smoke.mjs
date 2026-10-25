import assert from 'node:assert/strict';

const required = ['STAGING_SUPABASE_URL', 'STAGING_SUPABASE_PUBLISHABLE_KEY', 'STAGING_OWNER_ACCESS_TOKEN', 'STAGING_NONOWNER_ACCESS_TOKEN'];
const missing = required.filter(name => !process.env[name]);
if (missing.length) throw new Error(`Missing staging-only environment variables: ${missing.join(', ')}`);

const url = new URL(process.env.STAGING_SUPABASE_URL);
assert.equal(url.protocol, 'https:', 'Staging Supabase URL must use HTTPS');
assert.match(url.hostname, /^[a-z0-9-]+\.supabase\.co$/, 'Use a Supabase project URL');
assert.notEqual(url.hostname.split('.')[0], 'ygnousqevdbyzcxyhsfn', 'Refusing to run against the known Arabella’s World production project');

const publishableKey = process.env.STAGING_SUPABASE_PUBLISHABLE_KEY;
assert.ok(publishableKey.startsWith('sb_publishable_'), 'Use a modern publishable key; never use a secret/service-role key');

const api = `${url.origin}/rest/v1`;
async function request(path, {token, body} = {}) {
  const headers = {apikey: publishableKey, Accept: 'application/json'};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) {
    headers['Content-Type'] = 'application/json';
    headers.Prefer = 'return=minimal';
  }
  const response = await fetch(`${api}/${path}`, {method: body ? 'POST' : 'GET', headers, body: body ? JSON.stringify(body) : undefined});
  const text = await response.text();
  let payload;
  try { payload = text ? JSON.parse(text) : null; } catch { payload = text; }
  return {status: response.status, ok: response.ok, payload};
}
const owner = process.env.STAGING_OWNER_ACCESS_TOKEN;
const nonowner = process.env.STAGING_NONOWNER_ACCESS_TOKEN;

// Only read non-sensitive identifiers/revision metadata. Never fetch the workspace payload.
const ownerMembership = await request('dreamhub_owners?select=owner_id', {token: owner});
assert.equal(ownerMembership.status, 200, 'Invited owner must be able to read the own-membership row');
assert.equal(ownerMembership.payload?.length, 1, 'Staging owner token must identify the one seeded owner');

const otherMembership = await request('dreamhub_owners?select=owner_id', {token: nonowner});
assert.equal(otherMembership.status, 200, 'Non-owner membership query should be filtered by RLS');
assert.deepEqual(otherMembership.payload, [], 'Non-owner must not see the invited owner row');

const ownerState = await request('dreamhub_state?select=revision', {token: owner});
assert.equal(ownerState.status, 200, 'Invited owner must be allowed to read own state metadata');
assert.ok(Array.isArray(ownerState.payload), 'Owner state query must return rows, never workspace contents');

const otherState = await request('dreamhub_state?select=revision', {token: nonowner});
assert.equal(otherState.status, 200, 'Non-owner state query should be filtered by RLS');
assert.deepEqual(otherState.payload, [], 'Non-owner must not see the owner state row');

const anonymousMembership = await request('dreamhub_owners?select=owner_id');
assert.ok([401, 403].includes(anonymousMembership.status), 'Anonymous membership query must be denied');
const anonymousRpc = await request('rpc/dreamhub_save', {body: {p_expected: 0, p_payload: {}}});
assert.ok(!anonymousRpc.ok, 'Anonymous save RPC must be denied');

const nonownerRpc = await request('rpc/dreamhub_save', {token: nonowner, body: {p_expected: 0, p_payload: {}}});
assert.ok(!nonownerRpc.ok, 'Non-owner save RPC must be denied');
assert.match(JSON.stringify(nonownerRpc.payload), /NOT_AUTHORIZED/i, 'Non-owner save denial must come from the authorization guard');

// A deliberately stale revision proves the owner passed the membership guard but cannot write.
const ownerNoop = await request('rpc/dreamhub_save', {token: owner, body: {p_expected: -1, p_payload: {}}});
assert.ok(!ownerNoop.ok, 'The no-op owner probe must not write data');
assert.match(JSON.stringify(ownerNoop.payload), /VERSION_CONFLICT/i, 'Owner RPC must reach the revision guard without changing state');
const ownerStateAfter = await request('dreamhub_state?select=revision', {token: owner});
assert.deepEqual(ownerStateAfter.payload, ownerState.payload, 'Authorization probes must leave state unchanged');

console.log('PASS staging owner, non-owner, anonymous RLS and RPC checks; state was not modified.');
