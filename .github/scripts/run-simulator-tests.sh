#!/usr/bin/env bash
set -uo pipefail

generation=${1:?Expected an iPhone generation}
: "${SIMULATOR_ID:?Expected a simulator ID}"
mkdir -p test-artifacts

run_once() {
  local suffix=$1
  xcodebuild test -project ios/PocketDesktop.xcodeproj -scheme PocketDesktop \
    -destination "platform=iOS Simulator,id=$SIMULATOR_ID" \
    -resultBundlePath "test-artifacts/iPhone-${generation}${suffix}.xcresult" \
    CODE_SIGNING_ALLOWED=NO 2>&1 | tee "test-artifacts/xcodebuild${suffix}.log"
}

if run_once ""; then
  exit 0
else
  first_status=$?
fi

first_log=test-artifacts/xcodebuild.log
# Do not retry once an app test has started, even if the simulator then dies.
if grep -Fq "Test Case '" "$first_log"; then
  exit "$first_status"
fi
if ! grep -Fq 'The test runner hung before establishing connection' "$first_log" && \
   ! { grep -Fq 'Failed to install or launch the test runner' "$first_log" && \
       grep -Fq 'Mach error -308' "$first_log"; }; then
  exit "$first_status"
fi

echo '::warning::Simulator test runner failed before tests; rebooting and retrying once. The original log and result remain in the artifacts.'
xcrun simctl shutdown "$SIMULATOR_ID" || true
xcrun simctl boot "$SIMULATOR_ID" || exit "$first_status"
xcrun simctl bootstatus "$SIMULATOR_ID" -b || exit "$first_status"
run_once '-retry'
