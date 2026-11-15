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
            Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self, weak status] timer in
                guard let self = self, let status = status else { timer.invalidate(); return }
                guard let browser = self.embeddedBrowser else { return }
                browser.evaluateJavaScript("document.getElementById('screen_container')?.innerText || ''") { value, error in
                    if let error = error { print("V86_PROBE_ERROR: \(error.localizedDescription)"); return }
                    guard let screenText = value as? String else { return }
                    let normal = screenText.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
                    status.accessibilityLabel = "Guest screen: " + String(normal.suffix(1600))
                    print("V86_PROBE: \(normal.suffix(1600))")
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
        var booted = false
        for _ in 0..<55 {
            let screen = probe.label.lowercased()
            if screen.contains("welcome to buildroot") || screen.contains("buildroot login:") || screen.contains("/ #") {
                booted = true
                break
            }
            sleep(2)
        }
        print("V86_TEST_FINAL_SCREEN: \(probe.label)")
        capture("embedded-linux-research")
        XCTAssertTrue(booted, "Linux guest userspace was not observed in the embedded browser")
    }

'''
test_path.write_text(test_source.replace(capture_anchor, test + capture_anchor))
