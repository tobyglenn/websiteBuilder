import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('failure alerts are concise, deduplicated, retry delivery, and reset after recovery', () => {
  const dir = mkdtempSync(join(tmpdir(), 'clarity-notification-'));
  try {
    const bin = join(dir, 'bin');
    const scripts = join(dir, 'frontend/scripts');
    const report = join(dir, 'report');
    const logs = join(dir, 'logs');
    for (const path of [bin, scripts, report, logs]) mkdirSync(path, { recursive: true });
    const script = join(scripts, 'run-clarity-daily-snapshot.sh');
    copyFileSync(new URL('../run-clarity-daily-snapshot.sh', import.meta.url), script);
    writeFileSync(join(dir, 'secret.env'), 'CLARITY_API_TOKEN=test-only-secret\n');
    const helper = join(dir, 'helper.py');
    writeFileSync(helper, `import argparse,os,json
p=argparse.ArgumentParser()
p.add_argument('--error',action='store_true')
p.add_argument('--info',action='store_true')
p.add_argument('message')
a=p.parse_args()
with open(os.environ['TEST_BUILD_LOG'],'a') as f: f.write(json.dumps(vars(a))+'\\n')
`);
    writeFileSync(join(bin, 'npm'), '#!/bin/sh\nif [ "$TEST_COLLECT_OK" = 1 ]; then exit 0; fi\necho "Error: Clarity API 400"\necho "at INTERNAL_STACK_TRACE:111"\nexit 1\n', { mode: 0o755 });
    writeFileSync(join(bin, 'hermes'), '#!/bin/sh\nprintf "%s\\n" "$*" >> "$TEST_HERMES_ARGS"\ncat >> "$TEST_MESSAGES"\nexit "${TEST_DELIVERY_EXIT:-0}"\n', { mode: 0o755 });
    const fixture = { provider: 'microsoft-clarity', periods: { current: { snapshots: 7, readerSessions: 10, botSessions: 2 }, prior: { snapshots: 7 } }, currentPageDeviceFriction: [], currentAcquisition: [], comparisonReady: true };
    const latest = join(report, 'latest.json');
    writeFileSync(latest, JSON.stringify(fixture));
    writeFileSync(join(logs, 'clarity_daily_snapshot.cron.log'), 'OLD_SUCCESS_HISTORY_DO_NOT_SEND\n');
    const env = {
      ...process.env, PATH: `${bin}:${process.env.PATH}`, CLARITY_SECRET_FILE: join(dir, 'secret.env'),
      CLARITY_REPORT_DIR: report, CLARITY_LOG_DIR: logs, CLARITY_BUILD_LOG_HELPER: helper,
      TEST_BUILD_LOG: join(dir, 'build.log'), TEST_HERMES_ARGS: join(dir, 'hermes.args'), TEST_MESSAGES: join(dir, 'messages'),
    };
    const run = (overrides = {}) => spawnSync('bash', [script], { env: { ...env, ...overrides }, encoding: 'utf8' });
    const messages = () => readFileSync(env.TEST_MESSAGES, 'utf8').trim().split('\n');
    const marker = join(report, 'failure-notified');
    assert.equal(run().status, 1);
    assert.equal(messages().length, 1);
    assert.ok(messages()[0].length < 250);
    assert.doesNotMatch(messages()[0], /OLD_SUCCESS|INTERNAL_STACK|Error:|\/home\/|test-only-secret/);
    assert.match(readFileSync(env.TEST_HERMES_ARGS, 'utf8'), /--file - --quiet/);
    assert.ok(existsSync(marker));
    assert.equal(readFileSync(latest, 'utf8'), JSON.stringify(fixture));
    assert.equal(run().status, 1);
    assert.equal(messages().length, 1);
    const success = run({ TEST_COLLECT_OK: '1' });
    assert.equal(success.status, 0, success.stdout + success.stderr);
    assert.ok(!existsSync(marker));
    assert.equal(messages().length, 1); // Success stays out of Telegram.
    assert.equal(run({ TEST_DELIVERY_EXIT: '1' }).status, 1);
    assert.ok(!existsSync(marker)); // Failed delivery must not suppress retry.
    assert.equal(run().status, 1);
    assert.ok(existsSync(marker));
    assert.equal(messages().length, 3);
    assert.doesNotMatch(readFileSync(env.TEST_BUILD_LOG, 'utf8'), /unrecognized arguments/);
    rmSync(marker);
    assert.equal(run({ CLARITY_SECRET_FILE: join(dir, 'missing.env') }).status, 1);
    assert.ok(existsSync(marker));
    assert.equal(messages().length, 4);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
