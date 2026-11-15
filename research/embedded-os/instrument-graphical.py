#!/usr/bin/env python3
"""Extend the temporary embedded-OS simulator probe with a graphical guest check."""
from pathlib import Path

controller = Path('ios/PocketDesktop/DesktopViewController.swift')
source = controller.read_text()
anchor = '                browser.evaluateJavaScript("document.getElementById(\'screen_container\')?.innerText || \'\'") { value, error in\n'
assert source.count(anchor) == 1
replacement = r'''                let inspect = """
                (() => {
                  const screen = document.getElementById('screen_container');
                  if (!screen) return '';
                  const text = screen.innerText || '';
                  const canvas = screen.querySelector('canvas');
                  if (!canvas || getComputedStyle(canvas).display === 'none' || !canvas.width || !canvas.height) return text;
                  try {
                    const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
                    const colors = new Set();
                    let nonblack = 0;
                    const step = Math.max(4, Math.floor(data.length / 16000 / 4) * 4);
                    for (let i = 0; i < data.length; i += step) {
                      const r = data[i], g = data[i + 1], b = data[i + 2];
                      if (r + g + b > 20) nonblack++;
                      colors.add((r << 16) | (g << 8) | b);
                    }
                    if (nonblack > 100 && colors.size > 8) {
                      if (!window.__pocketVmScrolled) {
                        window.__pocketVmScrolled = true;
                        document.body.style.zoom = '0.55';
                        screen.scrollIntoView({block: 'end'});
                      }
                      return text + ' GRAPHICAL_VM_READY colors=' + colors.size;
                    }
                  } catch (e) { return text + ' GRAPHICS_PROBE_ERROR ' + String(e); }
                  return text;
                })()
                """
                browser.evaluateJavaScript(inspect) { value, error in
'''
controller.write_text(source.replace(anchor, replacement))

test_path = Path('ios/PocketDesktopUITests/PocketDesktopUITests.swift')
test_source = test_path.read_text()
capture_anchor = '    private func capture(_ name: String) {'
assert test_source.count(capture_anchor) == 1
test = r'''
    func testEmbeddedBrowserRendersGraphicalGuest() {
        let taskbar = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Taskbar")).firstMatch
        let browserButton = taskbar.buttons["Open Browser"]
        XCTAssertTrue(browserButton.waitForExistence(timeout: 10))
        browserButton.tap()
        let address = app.textFields["Web address or search"]
        XCTAssertTrue(address.waitForExistence(timeout: 10))
        address.tap()
        address.typeText("https://copy.sh/v86/?profile=kolibrios-fallback")
        app.buttons["Go"].tap()
        let probe = app.staticTexts["v86-research-screen"]
        XCTAssertTrue(probe.waitForExistence(timeout: 10))
        var rendered = false
        for _ in 0..<50 {
            if probe.label.contains("GRAPHICAL_VM_READY") { rendered = true; break }
            sleep(2)
        }
        if rendered { sleep(12) }
        print("V86_GRAPHICS_FINAL: \(probe.label)")
        capture("embedded-graphical-os-research")
        XCTAssertTrue(rendered, "No colorful graphical guest frame was observed")
    }

'''
test_path.write_text(test_source.replace(capture_anchor, test + capture_anchor))
