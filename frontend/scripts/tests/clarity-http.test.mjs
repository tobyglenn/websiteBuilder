import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import test from 'node:test';

const script = new URL('../clarity-insights.mjs', import.meta.url).href;

const runProbe = (endpoint) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import { fetchClarityMetrics } from ${JSON.stringify(script)};
    try {
      console.log(JSON.stringify(await fetchClarityMetrics({ dimensions: ['URL', 'Device'] })));
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
  `], {
    env: { ...process.env, CLARITY_API_URL: endpoint, CLARITY_API_TOKEN: 'test-only-secret' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', reject);
  child.on('close', (code) => resolve({ code, stdout, stderr }));
});

const probe = async (respond) => {
  const requests = [];
  const server = createServer((req, res) => {
    requests.push({ url: req.url, authorization: req.headers.authorization, agent: req.headers['user-agent'] });
    respond(req, res, requests.length);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return { ...await runProbe(`http://127.0.0.1:${server.address().port}/insights`), requests };
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
};

test('empty Node 400 falls back with the same auth and query', async () => {
  const result = await probe((req, res) => {
    if (!req.headers['user-agent']?.startsWith('Python-urllib/')) {
      res.writeHead(400).end();
    } else {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('[{"metricName":"Traffic","information":[]}]');
    }
  });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout)[0].metricName, 'Traffic');
  assert.equal(result.requests.length, 2);
  assert.equal(result.requests[0].url, result.requests[1].url);
  assert.match(result.requests[1].url, /dimension1=URL&dimension2=Device/);
  assert.ok(result.requests.every((request) => request.authorization === 'Bearer test-only-secret'));
  assert.ok(!result.stdout.includes('test-only-secret'));
});

test('temporary provider failure retries once and recovers', async () => {
  const result = await probe((req, res, count) => {
    res.writeHead(count === 1 ? 503 : 200).end(count === 1 ? 'unavailable' : '[]');
  });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(result.requests.length, 2);
});

test('permanent bad request and daily quota are not retried', async () => {
  for (const status of [400, 429]) {
    const result = await probe((req, res) => res.writeHead(status).end('rejected'));
    assert.equal(result.code, 1);
    assert.equal(result.requests.length, 1);
    assert.match(result.stderr, status === 429 ? /daily request quota/ : /Clarity API 400/);
  }
});

test('persistent outage stops after two requests', async () => {
  const result = await probe((req, res) => res.writeHead(503).end('unavailable'));
  assert.equal(result.code, 1);
  assert.equal(result.requests.length, 2);
});

test('empty rejection from both transports stops after one recovery attempt', async () => {
  const result = await probe((req, res) => res.writeHead(400).end());
  assert.equal(result.code, 1);
  assert.equal(result.requests.length, 4);
});

test('invalid provider payload remains a failure', async () => {
  const result = await probe((req, res) => res.writeHead(200).end('{"unexpected":true}'));
  assert.equal(result.code, 1);
  assert.match(result.stderr, /non-array/);
});
