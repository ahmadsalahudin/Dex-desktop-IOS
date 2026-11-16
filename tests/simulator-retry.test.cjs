const {test} = require('node:test');
const assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const script = path.resolve(__dirname, '../.github/scripts/run-simulator-tests.sh');

function exercise(scenario) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pocket-simulator-test-'));
  const bin = path.join(directory, 'bin');
  fs.mkdirSync(bin);
  fs.writeFileSync(path.join(bin, 'xcodebuild'), `#!/usr/bin/env bash
count=0
if [ -f "$TEST_COUNT" ]; then count=$(cat "$TEST_COUNT"); fi
count=$((count + 1))
echo "$count" > "$TEST_COUNT"
case "$TEST_SCENARIO:$count" in
  healthy:1) echo "Test Case '-[Suite example]' started."; exit 0 ;;
  disconnected:1|retry_fails:1|boot_fails:1) echo 'The test runner hung before establishing connection.'; exit 65 ;;
  server_died:1) echo 'Failed to install or launch the test runner. (Mach error -308 - (ipc/mig) server died)'; exit 65 ;;
  failed_test:1) echo "Test Case '-[Suite example]' started."; echo 'The test runner hung before establishing connection.'; exit 65 ;;
  unrelated_mach:1) echo 'Mach error -308 while exercising a test dependency'; exit 65 ;;
  unknown:1) echo 'Compilation failed'; exit 65 ;;
  retry_fails:2) echo 'Simulator still unavailable'; exit 65 ;;
  *) echo "Test Case '-[Suite example]' started."; exit 0 ;;
esac
`, {mode:0o755});
  fs.writeFileSync(path.join(bin, 'xcrun'), '#!/usr/bin/env bash\nprintf "%s\\n" "$*" >> "$TEST_SIMCTL"\nif [ "$TEST_SCENARIO" = boot_fails ] && [ "$*" = "simctl boot test-device" ]; then exit 1; fi\n', {mode:0o755});
  const result = spawnSync('bash', [script, '17'], {
    cwd:directory, encoding:'utf8', env:{...process.env, PATH:`${bin}:${process.env.PATH}`,
      SIMULATOR_ID:'test-device', TEST_SCENARIO:scenario,
      TEST_COUNT:path.join(directory,'count'), TEST_SIMCTL:path.join(directory,'simctl')}
  });
  const read = name => fs.existsSync(path.join(directory,name)) ? fs.readFileSync(path.join(directory,name),'utf8') : '';
  const outcome={result, count:Number(read('count') || 0), simctl:read('simctl'),
    first:read('test-artifacts/xcodebuild.log'), retry:read('test-artifacts/xcodebuild-retry.log')};
  fs.rmSync(directory,{recursive:true,force:true});
  return outcome;
}

test('a passing simulator run is not retried', () => {
  const r=exercise('healthy');
  assert.equal(r.result.status,0);
  assert.equal(r.count,1);
  assert.equal(r.simctl,'');
});

for (const scenario of ['disconnected','server_died']) {
  test(`${scenario} before tests reboots the simulator and retries once`, () => {
    const r=exercise(scenario);
    assert.equal(r.result.status,0);
    assert.equal(r.count,2);
    assert.match(r.simctl,/simctl shutdown test-device/);
    assert.match(r.simctl,/simctl boot test-device/);
    assert.match(r.simctl,/simctl bootstatus test-device -b/);
    assert.ok(r.first && r.retry, 'both attempts retain their logs');
  });
}

for (const scenario of ['failed_test','unrelated_mach','unknown','retry_fails','boot_fails']) {
  test(`${scenario} remains a failure`, () => {
    const r=exercise(scenario);
    assert.equal(r.result.status,65);
    assert.equal(r.count,scenario==='retry_fails'?2:1);
    if (!['retry_fails','boot_fails'].includes(scenario)) assert.equal(r.simctl,'');
  });
}
