#!/usr/bin/env python3
"""Capture public, unauthenticated service entry pages in iPhone Simulator."""
from pathlib import Path
p = Path('ios/PocketDesktopUITests/PocketDesktopUITests.swift')
s = p.read_text()
anchor = '    private func capture(_ name: String) {'
assert s.count(anchor) == 1
method = r'''
    func testPublicServiceEntryScreens() {
        let samples = [
            ("whatsapp", "https://web.whatsapp.com/"),
            ("telegram", "https://web.telegram.org/k/"),
            ("instagram", "https://www.instagram.com/"),
            ("youtube", "https://www.youtube.com/"),
            ("outlook", "https://outlook.live.com/mail/0/"),
            ("spotify", "https://open.spotify.com/")
        ]
        for (index, sample) in samples.enumerated() {
            if index > 0 {
                app.terminate()
                app.launch()
                XCTAssertTrue(app.buttons["Open applications"].waitForExistence(timeout: 20))
            }
            let taskbar = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Taskbar")).firstMatch
            taskbar.buttons["Open Browser"].tap()
            let address = app.textFields["Web address or search"].firstMatch
            XCTAssertTrue(address.waitForExistence(timeout: 10))
            address.tap()
            address.typeText(sample.1)
            app.buttons["Go"].firstMatch.tap()
            sleep(17)
            print("PUBLIC_SITE_PROBE \(sample.0) webViewCount=\(app.webViews.count)")
            capture("public-site-\(sample.0)")
        }
    }

'''
p.write_text(s.replace(anchor, method + anchor))
