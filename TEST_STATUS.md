# Test status — 11 November 2026

## Executed in this development environment

| Check | Result | What it demonstrates |
| --- | --- | --- |
| JavaScript core | 11 / 11 passed | Window geometry, eight resize directions, edge cases, snapping, calculator and URL validation. |
| WebKit desktop browser | 15 / 15 passed | Desktop launcher/search, notes persistence, file preview, calculator, mouse-style pointer movement, all eight resize handles, all seven app windows, snapping, simulated keyboard input, show desktop, right-click desktop menu, Alt+Tab/Alt+F4, and the JavaScript side of the native browser bridge. |
| Firefox desktop browser | 15 / 15 passed | The same browser interaction suite on a second browser engine. |
| WebKit mobile profiles | 3 / 3 passed | Landscape touch, app search, side-by-side snapped windows and calculation on iPhone 16 Pro and 17 Pro browser profiles, plus an 18 Pro-sized viewport approximation. |
| Source structure | Passed | JavaScript syntax, Swift grammar parsing, Xcode project parsing, test scheme XML, Info.plist orientations, and simulator workflow matrix. These checks do **not** compile Swift or validate Apple's frameworks. |

The desktop native-browser bridge test uses a simulated JavaScript message handler; it validates messages and interface behavior, not the Swift WKWebView implementation. The 18 Pro profile uses the 17 Pro browser descriptor as an approximation because their listed panel resolution matches. Linux WebKit is the WebKit engine, **not Apple's iOS Simulator, iOS Safari, or a real iPhone**.

## Not yet executed — required to complete the request

1. Build the Xcode project and execute the UI tests in Apple iOS Simulator. `.github/workflows/simulator-tests.yml` prepares a three-generation Mac runner matrix, but no workflow run has been started. The current connected GitHub installations expose public repositories unrelated to this project; an isolated private repository or another accessible Mac is needed.
2. Inspect Simulator test logs and screenshots; fix and rerun any build or behavioral failures. The native browser view and landscape orientation have not been exercised in iOS.
3. On real iPhones, test a USB mouse, Bluetooth mouse, USB keyboard, Bluetooth keyboard, hub and external monitor. Simulated pointer or keyboard events do not validate physical hardware or system accessibility setup.
4. Check web sign-in, file picker, browser popups, and display/rotation on the target iPhones. Some websites restrict in-app browsers, and the system imposes restrictions no app can eliminate.

No claim of exact Samsung DeX equivalence or zero blocked issues is made.

## Screenshots

The five screenshots in `screenshots/` were captured from the running interface using Linux WebKit. Desktop previews and the iPhone-sized browser profile are labeled by filename; none is an Apple iOS Simulator or a physical iPhone screenshot.
