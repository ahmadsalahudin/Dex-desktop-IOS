import XCTest

final class PocketDesktopUITests: XCTestCase {
    private var app: XCUIApplication!

    override func setUpWithError() throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.buttons["Open applications"].waitForExistence(timeout: 20), "Desktop did not load")
        capture("desktop-launched")
    }

    func testLandscapeNotesAndMinimizeRestore() {
        let frame = app.windows.firstMatch.frame
        XCTAssertGreaterThan(frame.width, frame.height, "Desktop should start in landscape")
        app.buttons["Open Notes"].firstMatch.tap()
        let note = app.textViews["Note text"]
        XCTAssertTrue(note.waitForExistence(timeout: 10))
        note.tap()
        note.typeText("Simulator note")
        XCTAssertTrue((note.value as? String ?? "").contains("Simulator note"))
        app.buttons["Minimize"].firstMatch.tap()
        let restore = app.buttons["Restore Notes"].firstMatch
        XCTAssertTrue(restore.waitForExistence(timeout: 5))
        restore.tap()
        XCTAssertTrue(note.waitForExistence(timeout: 5))
        XCTAssertTrue((note.value as? String ?? "").contains("Simulator note"))
        capture("notes-and-window")
    }

    func testCalculatorAndSnapping() {
        app.buttons["Open Calculator"].firstMatch.tap()
        XCTAssertTrue(app.buttons["8"].waitForExistence(timeout: 10))
        app.buttons["8"].firstMatch.tap()
        app.buttons["×"].firstMatch.tap()
        app.buttons["7"].firstMatch.tap()
        app.buttons["="].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["56"].waitForExistence(timeout: 5))
        app.buttons["Snap left"].firstMatch.tap()
        XCTAssertTrue(app.staticTexts["56"].exists)
        capture("calculator-snapped")
    }

    func testBrowserOpensAsAWindow() {
        // The taskbar icon stays clear of first-launch iOS notification banners.
        let browserButtons = app.buttons.matching(identifier: "Open Browser")
        XCTAssertGreaterThan(browserButtons.count, 0)
        browserButtons.element(boundBy: browserButtons.count - 1).tap()
        let address = app.textFields["Web address or search"]
        XCTAssertTrue(address.waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Go"].exists)
        XCTAssertTrue(app.buttons["Snap right"].exists)
        address.tap()
        address.typeText("https://example.com")
        app.buttons["Go"].tap()
        XCTAssertTrue(app.staticTexts["Example Domain"].waitForExistence(timeout: 25), "Native browser did not load the test page")
        capture("browser-window")
    }

    func testWindowCanBeResized() {
        app.buttons["Open Notes"].firstMatch.tap()
        let notesWindow = app.otherElements["Notes window"].firstMatch
        XCTAssertTrue(notesWindow.waitForExistence(timeout: 10))
        let original = notesWindow.frame
        let start = notesWindow.coordinate(withNormalizedOffset: CGVector(dx: 0.99, dy: 0.5))
        let end = start.withOffset(CGVector(dx: 50, dy: 0))
        start.press(forDuration: 0.2, thenDragTo: end)
        XCTAssertGreaterThan(notesWindow.frame.width, original.width + 20, "Right edge did not resize")
        capture("notes-resized")
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
