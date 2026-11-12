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
        let taskbar = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Taskbar")).firstMatch
        let browserButton = taskbar.buttons["Open Browser"]
        XCTAssertTrue(browserButton.waitForExistence(timeout: 10), "Browser taskbar shortcut is missing")
        browserButton.tap()
        let address = app.textFields["Web address or search"]
        XCTAssertTrue(address.waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["Go"].exists)
        XCTAssertTrue(app.buttons["Snap right"].exists)
        address.tap()
        address.typeText("https://example.com")
        app.buttons["Go"].tap()
        XCTAssertTrue(app.otherElements["Example Domain"].waitForExistence(timeout: 25), "Native browser did not load the test page")
        let nativePage = app.webViews.containing(.other, identifier: "Example Domain").firstMatch
        XCTAssertTrue(nativePage.waitForExistence(timeout: 5), "Native browser view is missing")
        let windowFrame = app.otherElements["Browser window"].firstMatch.frame
        let addressFrame = address.frame
        let pageFrame = nativePage.frame
        print("Browser geometry: window=\(windowFrame), address=\(addressFrame), page=\(pageFrame)")
        XCTAssertGreaterThanOrEqual(pageFrame.minX, windowFrame.minX - 2, "Browser page extends beyond the left edge")
        XCTAssertLessThanOrEqual(pageFrame.maxX, windowFrame.maxX + 2, "Browser page extends beyond the right edge")
        XCTAssertGreaterThanOrEqual(pageFrame.minY, addressFrame.maxY - 2, "Browser page overlaps the address bar")
        XCTAssertLessThanOrEqual(pageFrame.maxY, windowFrame.maxY + 2, "Browser page extends below its window")
        capture("browser-window")
        let browserWindow = app.otherElements["Browser window"].firstMatch
        let resizeStart = browserWindow.coordinate(withNormalizedOffset: CGVector(dx: 0.995, dy: 0.65))
        let resizeEnd = resizeStart.withOffset(CGVector(dx: 50, dy: 0))
        resizeStart.press(forDuration: 0.2, thenDragTo: resizeEnd)
        XCTAssertGreaterThan(browserWindow.frame.width, windowFrame.width + 20,
                             "Browser right edge did not resize after loading a page")
        XCTAssertTrue(nativePage.exists, "The browser page disappeared while resizing")
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

    func testDesktopFillsLandscapeScreen() {
        let desktop = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Desktop workspace")).firstMatch
        XCTAssertTrue(desktop.waitForExistence(timeout: 5), "Desktop workspace is missing")
        let screenFrame = app.windows.firstMatch.frame
        let desktopFrame = desktop.frame
        print("Desktop geometry: screen=\(screenFrame), desktop=\(desktopFrame)")
        XCTAssertEqual(desktopFrame.width, screenFrame.width, accuracy: 2, "Desktop does not fill the screen width")
        XCTAssertEqual(desktopFrame.height, screenFrame.height, accuracy: 2, "Desktop does not fill the screen height")
    }

    func testSwitchBetweenSnappedWindowsAndEdit() {
        let taskbar = app.otherElements.matching(NSPredicate(format: "label BEGINSWITH %@", "Taskbar")).firstMatch
        taskbar.buttons["Open Notes"].tap()
        let notes = app.otherElements["Notes window"].firstMatch
        XCTAssertTrue(notes.waitForExistence(timeout: 10))
        notes.buttons["Snap left"].tap()
        taskbar.buttons["Open Calculator"].tap()
        let calculator = app.otherElements["Calculator window"].firstMatch
        XCTAssertTrue(calculator.waitForExistence(timeout: 10))
        calculator.buttons["Snap right"].tap()
        capture("snapped-windows-before-edit")
        let editor = notes.textViews["Note text"].firstMatch
        XCTAssertTrue(editor.waitForExistence(timeout: 5))
        editor.tap()
        editor.typeText("Multitasking")
        XCTAssertTrue((editor.value as? String ?? "").contains("Multitasking"))
        capture("snapped-windows")
    }

    private func capture(_ name: String) {
        let attachment = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        attachment.name = name
        attachment.lifetime = .keepAlways
        add(attachment)
    }
}
