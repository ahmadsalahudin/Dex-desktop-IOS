#!/usr/bin/env python3
"""Add a temporary local-fixture XCTest to a disposable simulator checkout."""
from pathlib import Path
import plistlib

app = Path('app/app.js')
source = app.read_text()
original = 'https://web.telegram.org/k/'
assert source.count(original) == 1
app.write_text(source.replace(original, 'http://127.0.0.1:18765/check'))

info = Path('ios/PocketDesktop/Info.plist')
with info.open('rb') as f: data = plistlib.load(f)
data.setdefault('NSAppTransportSecurity', {})['NSAllowsLocalNetworking'] = True
with info.open('wb') as f: plistlib.dump(data, f)

test = Path('ios/PocketDesktopUITests/PocketDesktopUITests.swift')
source = test.read_text()
anchor = '    private func capture(_ name: String) {'
assert source.count(anchor) == 1
method = r'''
    func testSeparateWebWindowsAndPersistentSession() {
        let taskbar = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Taskbar")).firstMatch
        taskbar.buttons["Open Browser"].tap()
        let browser = app.otherElements["Browser window"].firstMatch
        let address = browser.textFields["Web address or search"].firstMatch
        XCTAssertTrue(address.waitForExistence(timeout: 10))
        address.tap()
        address.typeText("http://127.0.0.1:18765/set")
        browser.buttons["Go"].tap()
        XCTAssertTrue(app.staticTexts["POCKET_SESSION_SET"].waitForExistence(timeout: 30), "First test page was not loaded")
        browser.buttons["Snap left"].tap()
        taskbar.buttons["Open Web apps"].tap()
        let directory = app.otherElements["Web apps window"].firstMatch
        XCTAssertTrue(directory.waitForExistence(timeout: 10))
        capture("web-apps-directory")
        let telegram = directory.buttons["Open Telegram"].firstMatch
        XCTAssertTrue(telegram.waitForExistence(timeout: 10))
        telegram.tap()
        let second = app.otherElements["Telegram window"].firstMatch
        XCTAssertTrue(second.waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["POCKET_SESSION_OK"].waitForExistence(timeout: 30), "Second pane did not receive the shared site cookie")
        second.buttons["Snap right"].tap()
        sleep(3)
        XCTAssertTrue(app.staticTexts["POCKET_SESSION_SET"].exists, "First web view was lost after opening the second")
        XCTAssertTrue(app.staticTexts["POCKET_SESSION_OK"].exists, "Second web view is missing")
        let left = browser.frame, right = second.frame
        XCTAssertLessThanOrEqual(left.maxX, right.minX + 3, "Web windows did not snap side by side")
        capture("two-web-windows")
        let leftClick = app.buttons["Test left click"].firstMatch
        XCTAssertTrue(leftClick.waitForExistence(timeout: 5))
        leftClick.tap()
        XCTAssertTrue(app.buttons["LEFT_CLICK_OK"].waitForExistence(timeout: 5), "Left pane did not receive a tap")
        let rightClick = app.buttons["Test right click"].firstMatch
        XCTAssertTrue(rightClick.waitForExistence(timeout: 5))
        rightClick.tap()
        XCTAssertTrue(app.buttons["RIGHT_CLICK_OK"].waitForExistence(timeout: 5), "Right pane did not receive a tap")
        let leftInput = app.textFields["Left web input"].firstMatch
        XCTAssertTrue(leftInput.waitForExistence(timeout: 5))
        leftInput.tap()
        leftInput.typeText("alpha")
        leftInput.typeText("beta")
        XCTAssertTrue((leftInput.value as? String ?? "").contains("alphabeta"), "Left web page did not retain keyboard input")
        leftInput.typeText("\n")
        let rightInput = app.textFields["Right web input"].firstMatch
        XCTAssertTrue(rightInput.waitForExistence(timeout: 5))
        rightInput.tap()
        rightInput.typeText("gamma")
        rightInput.typeText("delta")
        XCTAssertTrue((rightInput.value as? String ?? "").contains("gammadelta"), "Right web page did not retain keyboard input")
        rightInput.typeText("\n")
        taskbar.buttons["Open Notes"].tap()
        let notes = app.otherElements["Notes window"].firstMatch
        let editor = notes.textViews["Note text"].firstMatch
        XCTAssertTrue(editor.waitForExistence(timeout: 10))
        editor.tap()
        editor.typeText("Overlay works")
        XCTAssertTrue((editor.value as? String ?? "").contains("Overlay works"), "Overlapping Notes window did not receive input")
        capture("notes-over-web-windows")

        app.terminate()
        app.launch()
        XCTAssertTrue(app.buttons["Open applications"].waitForExistence(timeout: 20))
        let desktopApps = app.otherElements["Desktop apps"].firstMatch
        let browserAgain = desktopApps.buttons["Open Browser"].firstMatch
        XCTAssertTrue(browserAgain.waitForExistence(timeout: 10))
        sleep(2)
        browserAgain.tap()
        let field = app.textFields["Web address or search"].firstMatch
        XCTAssertTrue(field.waitForExistence(timeout: 10))
        field.tap()
        field.typeText("http://127.0.0.1:18765/check")
        app.buttons["Go"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["POCKET_SESSION_OK"].waitForExistence(timeout: 30), "Persistent cookie did not survive an app restart")
        capture("web-session-after-relaunch")
    }

'''
extra = r'''
    func testNativeBrowserRedirectUpdatesAddress() {
        let taskbar = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Taskbar")).firstMatch
        taskbar.buttons["Open Browser"].tap()
        let address = app.textFields["Web address or search"].firstMatch
        XCTAssertTrue(address.waitForExistence(timeout: 10))
        address.tap()
        address.typeText("http://127.0.0.1:18765/redirect")
        app.buttons["Go"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["POCKET_SESSION_SET"].waitForExistence(timeout: 30))
        let updated = NSPredicate(format: "value CONTAINS %@", "/set")
        expectation(for: updated, evaluatedWith: address)
        waitForExpectations(timeout: 8)
    }

    func testWebPopupRetainsOpener() {
        let taskbar = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Taskbar")).firstMatch
        taskbar.buttons["Open Browser"].tap()
        let address = app.textFields["Web address or search"].firstMatch
        XCTAssertTrue(address.waitForExistence(timeout: 10))
        address.tap()
        address.typeText("http://127.0.0.1:18765/set")
        app.buttons["Go"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["POCKET_SESSION_SET"].waitForExistence(timeout: 30))
        let popup = app.buttons["Open left popup"].firstMatch
        XCTAssertTrue(popup.waitForExistence(timeout: 5))
        popup.tap()
        let completePopup = app.buttons["Complete popup"].firstMatch
        XCTAssertTrue(completePopup.waitForExistence(timeout: 10), "Popup did not open")
        completePopup.tap()
        XCTAssertTrue(app.staticTexts["POPUP_ROUNDTRIP_OK"].waitForExistence(timeout: 10), "Popup could not send a message back to its opener")
        capture("popup-roundtrip")
    }

'''
test.write_text(source.replace(anchor, method + extra + anchor))
