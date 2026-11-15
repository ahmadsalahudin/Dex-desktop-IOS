#!/usr/bin/env python3
"""Instrument a temporary simulator build for an embedded v86 feasibility test.

This script edits only the checked-out research workspace. It is not a release
implementation and must not be applied to a shipping app.
"""
from pathlib import Path

controller = Path('ios/PocketDesktop/DesktopViewController.swift')
source = controller.read_text()
anchor = '        view.addSubview(browserContainer)\n'
assert source.count(anchor) == 1
probe = r'''
        // Research-only: expose the embedded emulator's on-screen text to UI tests.
        if ProcessInfo.processInfo.arguments.contains("--research-embedded-os") {
            let status = UILabel(frame: CGRect(x: 8, y: 8, width: 220, height: 26))
            status.accessibilityIdentifier = "v86-research-screen"
            status.accessibilityLabel = "Waiting for emulator screen"
            status.text = "OS research probe active"
            status.font = UIFont.systemFont(ofSize: 11)
            status.textColor = .white
            status.backgroundColor = UIColor.black.withAlphaComponent(0.7)
            view.addSubview(status)
            var submittedProbe = false
            Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self, weak status] timer in
                guard let self = self, let status = status else { timer.invalidate(); return }
                guard let browser = self.embeddedBrowser else { return }
                browser.evaluateJavaScript("document.getElementById('screen_container')?.innerText || ''") { value, error in
                    if let error = error { print("V86_PROBE_ERROR: \(error.localizedDescription)"); return }
                    guard let screenText = value as? String else { return }
                    let normal = screenText.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
                    status.accessibilityLabel = "Guest screen: " + String(normal.suffix(1600))
                    print("V86_PROBE: \(normal.suffix(1600))")
                    if !submittedProbe && normal.contains("Files send via emulator appear in /mnt/") && normal.contains("~%") {
                        submittedProbe = true
                        // Synthetic events prove guest response, not physical keyboard support.
                        let inject = """
                        (() => {
                          const keys = ['KeyE','KeyC','KeyH','KeyO','Space','KeyV','KeyM','KeyP','KeyR','KeyO','KeyB','KeyE','Enter'];
                          const send = () => {
                            const code = keys.shift();
                            const key = code === 'Space' ? ' ' : code === 'Enter' ? 'Enter' : code.slice(3).toLowerCase();
                            for (const type of ['keydown', 'keyup']) {
                              document.body.dispatchEvent(new KeyboardEvent(type, {key, code, bubbles: true}));
                            }
                            if (keys.length) setTimeout(send, 75);
                          };
                          send();
                          return true;
                        })()
                        """
                        browser.evaluateJavaScript(inject) { _, error in
                            if let error = error { print("V86_INPUT_ERROR: \(error.localizedDescription)") }
                        }
                    }
                }
            }
        }
'''
controller.write_text(source.replace(anchor, anchor + probe))

test_path = Path('ios/PocketDesktopUITests/PocketDesktopUITests.swift')
test_source = test_path.read_text()
launch_anchor = '        app.launch()\n'
assert test_source.count(launch_anchor) == 1
test_source = test_source.replace(launch_anchor, '        app.launchArguments.append("--research-embedded-os")\n' + launch_anchor)
capture_anchor = '    private func capture(_ name: String) {'
assert test_source.count(capture_anchor) == 1
test = r'''
    func testEmbeddedBrowserRunsSmallLinuxGuest() {
        let taskbar = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Taskbar")).firstMatch
        let browserButton = taskbar.buttons["Open Browser"]
        XCTAssertTrue(browserButton.waitForExistence(timeout: 10))
        browserButton.tap()
        let address = app.textFields["Web address or search"]
        XCTAssertTrue(address.waitForExistence(timeout: 10))
        address.tap()
        address.typeText("https://copy.sh/v86/?profile=buildroot")
        app.buttons["Go"].tap()
        let probe = app.staticTexts["v86-research-screen"]
        XCTAssertTrue(probe.waitForExistence(timeout: 10))
        var commandWorked = false
        for _ in 0..<55 {
            let screen = probe.label.lowercased()
            if let command = screen.range(of: "echo vmprobe"), screen[command.upperBound...].contains("vmprobe") {
                commandWorked = true
                break
            }
            sleep(2)
        }
        print("V86_TEST_FINAL_SCREEN: \(probe.label)")
        capture("embedded-linux-research")
        XCTAssertTrue(commandWorked, "The Linux guest did not echo the research command")
    }

'''
test_path.write_text(test_source.replace(capture_anchor, test + capture_anchor))
