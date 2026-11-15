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
            ("spotify", "https://open.spotify.com/"),
            ("gmail", "https://mail.google.com/"),
            ("desktop-os", "https://copy.sh/v86/?profile=kolibrios-fallback")
        ]
        for (index, sample) in samples.enumerated() {
            if index > 0 {
                let previous = app.otherElements["Browser window"].firstMatch
                previous.buttons["Close"].tap()
            }
            let desktop = app.otherElements["Desktop apps"].firstMatch
            let browserButton = desktop.buttons["Open Browser"].firstMatch
            XCTAssertTrue(browserButton.waitForExistence(timeout: 10))
            browserButton.tap()
            let address = app.textFields["Web address or search"].firstMatch
            XCTAssertTrue(address.waitForExistence(timeout: 10))
            address.tap()
            address.typeText(sample.1)
            app.buttons["Go"].firstMatch.tap()
            sleep(sample.0 == "desktop-os" ? 35 : 17)
            print("PUBLIC_SITE_PROBE \(sample.0) webViewCount=\(app.webViews.count)")
            capture("public-site-\(sample.0)")
        }
    }

'''
p.write_text(s.replace(anchor, method + anchor))

controller = Path('ios/PocketDesktop/DesktopViewController.swift')
source = controller.read_text()
anchor = '    private func safeWebURL(_ raw: String) -> URL? {'
assert source.count(anchor) == 1
probe = r"""
    // Disposable CI-only probe: all sites are opened without account credentials.
    func webView(_ probeView: WKWebView, didFinish navigation: WKNavigation!) {
        guard probeView !== webView else { return }
        DispatchQueue.main.asyncAfter(deadline: .now() + 12) { [weak probeView] in
            guard let probeView = probeView else { return }
            probeView.evaluateJavaScript("(document.body && document.body.innerText || '').slice(0, 1400)") { value, _ in
                let text = (value as? String ?? "").replacingOccurrences(of: "\n", with: " ")
                print("PUBLIC_SITE_TEXT host=\(probeView.url?.host ?? "unknown") text=\(text)")
            }
        }
    }

"""
controller.write_text(source.replace(anchor, probe + anchor))
