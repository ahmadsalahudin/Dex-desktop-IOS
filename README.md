# Pocket Desktop for iPhone and iPad — prototype 3

A DeX-inspired workspace with its own resizable apps. This repository contains source code and tests; it is **not a signed iPhone release**. The prototype has run in Linux browser tests and Apple iOS Simulators. Physical iPhone testing remains outstanding; see `TEST_STATUS.md` for results and limitations.

## Try the demo

[Open the interactive demo](https://pocket-desktop-iphone-demo.salahudin.chatgpt.site/) or [watch the iPhone simulator video](media/Pocket_Desktop_iPhone_Simulator_Demo.mp4). The video is recorded from the native app in Apple’s iPhone simulator. The interactive demo uses the same desktop interface code in a browser, so its embedded browser and hardware behavior differ from the iOS app.

## What changed

- iOS project configured to open in **landscape**.
- All seven built-in windows can be moved, resized from any edge or corner, snapped left or right, minimized, maximized, and restored. The app drawer has search, and the taskbar has a Show Desktop control.
- Mouse-style pointer events and touch are used for window controls. Keyboard events are supported for typing, calculator entry and Control+Option+Left/Right snapping; some system shortcuts may be intercepted by iOS.
- The iOS wrapper now contains a separate native WKWebView for the browser window instead of relying on an iframe. This avoids the specific iframe embedding restriction for ordinary web pages. The browser-only preview still uses an iframe.
- Desktop right-click options and Alt+Tab/Alt+F4 window controls were added and tested in browsers when those key events reach the app.
- A macOS GitHub Actions workflow and XCTest UI tests have run for iPhone 18 Pro, 17, and 16e simulators. See `TEST_STATUS.md` for the outcomes.

## Supported targets and actual verification

The project declares iOS/iPadOS **16 or newer** and is intended for recent iPhone 18, 17, and 16 generations on compatible iOS releases. The current three major iOS generations are 27, 26, and 18. The six native UI tests passed on iPhone 16e / iOS 26.2, iPhone 17 / iOS 27.2, and iPhone 18 Pro / iOS 27.2 simulators. iOS 18, iPad, and physical-device compatibility remain unverified.

The code ran through WebKit mobile browser profiles corresponding to iPhone 16 Pro and 17 Pro landscape sizes, plus an 18 Pro-sized approximation based on the same physical panel resolution. Those tests are useful but **are not an Apple iOS Simulator or a real iPhone**. Refer to `TEST_STATUS.md` for the current test record and remaining checks, and `DEX_FEATURE_COMPARISON.md` for the full feature matrix.

## What iOS and websites still restrict

- iOS does not allow this app to run arbitrary installed iPhone apps as windows, read all system notifications, or replace the iOS system desktop. Only this app's own tools run as desktop windows. Launching another app normally brings it to the foreground.
- With the current project, iPhone display output is **mirroring**. It is not a separate interactive desktop on the monitor while the phone runs another app. An adapter, compatible display, and device are required; some iPads offer other system-managed display modes.
- iPhone 16e and 17e do **not** support the USB-C display output listed for the other 16/17 models. Apple lists AirPlay as a way to mirror those models. USB-C accessory and hub support may still be available independently of video output.
- A native web view can display many pages that reject iframe previews, but a website may still block embedded or in-app browsers, sign-in, pop-ups, or insecure HTTP. The app offers Safari as a fallback; there is no promise to bypass a site's restrictions.
- A Simulator cannot fully prove compatibility with your actual USB hub, HDMI adapter, Bluetooth mouse/keyboard, display, iOS accessibility settings, or hardware performance. Those require physical-device testing.

## Mouse and keyboard setup on iPhone

1. For a **Bluetooth keyboard**, pair it in iPhone Settings → Bluetooth. For a wired keyboard, connect it directly or using a compatible USB-C hub.
2. For a **USB or Bluetooth mouse**, go to Settings → Accessibility → Touch → **AssistiveTouch** and turn it on. Connect the wired device, or select Devices → Bluetooth Devices to pair a Bluetooth mouse. The system controls the pointer.
3. For a monitor and wired accessories together, use a compatible USB-C hub with the necessary ports and power. Video output depends on the phone model; see the 16e/17e exception above. AirPlay is the alternative where supported.
4. Open Pocket Desktop, drag a title bar to move a window, or drag any border/corner to resize. The native app requests landscape orientation. Actual hardware behavior has not been validated yet.

## Preview on Windows and iPhone

1. Clone the repository, or download and extract its ZIP with the folder structure intact. Install Python 3 if needed.
2. Double-click `start-preview-windows.bat` and keep its window open. On the PC, go to **http://localhost:8080**.
3. To view it on a phone on the same Wi-Fi, run `ipconfig` on Windows, find the Wi-Fi adapter's IPv4 address and enter `http://YOUR_IPV4_ADDRESS:8080` in Safari. You may need to allow Python through the private-network Windows firewall. Other devices on that network can reach this preview while it runs; Ctrl+C stops it.

This is a web preview and does not reproduce the native app's landscape lock or separate native browser view. The native app must be built and installed separately.

## Build or test on a Mac

1. Open `ios/PocketDesktop.xcodeproj` in an Xcode version that supports your target device and OS. Xcode 27 is appropriate for the newest iOS 27 devices.
2. To install on your own iPhone, sign into Xcode with your Apple Account, select your **Personal Team** under Signing & Capabilities, set a unique bundle identifier, connect the phone and press Run. Enable Developer Mode if requested. Apple says free Personal Team provisioning profiles expire after seven days.
3. For Simulator testing, select an available iPhone Simulator, then use **Product → Test**. The included UI tests check landscape launch and screen size, notes, minimize/restore, the calculator, side-by-side snapping and editing, browser navigation and geometry, and a window resize. They also save screenshots to the test result bundle. The suite has been run with Xcode on hosted Macs; inspect `TEST_STATUS.md` for the latest recorded results.

## Cloud Mac path without owning a Mac

The included `.github/workflows/simulator-tests.yml` is designed to run those UI tests on GitHub-hosted Macs, on an iPhone 18 and 17 using the `xcode-27` runner and an iPhone 16 generation using `macos-26`. It selects an installed matching simulator and uploads logs, screenshots and `.xcresult` bundles. If a model/runtime is unavailable, that job fails explicitly instead of pretending it passed.

To use it, place this project in an appropriately private GitHub repository and enable Actions. Open a pull request containing the workflow, or run **Actions → Test on iOS Simulator → Run workflow** once the workflow is on the default branch. GitHub's private-repository Actions limits and macOS minute multipliers may apply. Open a completed workflow run and download its simulator artifacts for XCTest screenshots and logs. A separate `Build unsigned iOS app` workflow can create an unsigned IPA; that IPA still needs device signing. The simulator workflow has been exercised. The unsigned IPA workflow has not yet been verified.

## Local checks

```sh
node --test tests/core.test.cjs
npm install
npx playwright install webkit firefox
BROWSER_ENGINE=webkit node --test tests/desktop.test.cjs
node --test tests/mobile-webkit.test.cjs
```

On Windows PowerShell, set `$env:BROWSER_ENGINE = 'webkit'` before the desktop test. Playwright's browser binaries and system dependencies must be installed on your OS. The UI tests under `ios/PocketDesktopUITests` require Xcode and an iOS Simulator.

## Sources

- Apple: [iOS-compatible iPhone models](https://support.apple.com/en-bw/guide/iphone/iphe3fa5df43/ios)
- Apple: [Connect an iPhone to displays and USB-C devices](https://support.apple.com/en-gb/105099)
- Apple: [Use a wired or Bluetooth pointer](https://support.apple.com/en-in/111775)
- Apple: [Presenting content on a connected display](https://developer.apple.com/documentation/uikit/presenting-content-on-a-connected-display)
- Apple: [Personal Team limits](https://developer.apple.com/help/account/basics/about-your-developer-account)
- GitHub: [macOS and Xcode runner images](https://github.com/actions/runner-images)


---
Original repository description: dex desktop mode remake for apple ios.
