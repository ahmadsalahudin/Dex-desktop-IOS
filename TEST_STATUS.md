# Test status — 16 November 2026

## Latest candidate

- [Desktop simulator suite](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43786820454): 6/6 tests passed on each of iPhone 16e / iOS 26.2, iPhone 17 / iOS 27.2 and iPhone 18 Pro / iOS 27.2. These exercise the desktop, notes, calculator, snapping and basic browser window, not every web service.
- [Browser suite](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43786815233): 34/34 checks passed. [Device build](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43786815234): the iPhone target built and an unsigned IPA was packaged.
- [Web-window suite](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43786815227): 4/5 passed on iPhone 17, covering browser loading, redirect tracking, focus after scrolling a background pane, and two local web windows with input and a cookie that persisted across app restart. The pop-up test failed before opening the pop-up because the test address field remained empty; that result does not establish whether the pop-up works.
- In an earlier [pop-up run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43731631490), the pop-up appeared but XCUITest could not resolve a tappable accessibility point. A coordinate-based test is being investigated separately; VoiceOver is not verified.
- Tests use simulator input and local test pages, not authenticated provider accounts. Real iPhone, HDMI, USB/Bluetooth hardware, actual website login and graphical guest-OS input are unverified. The IPA is unsigned and cannot be installed as-is.

## Web-app workspace update — 15 November 2026

- **Historical 15 November blocker.** A simulator run found that scrolling an inactive web pane did not focus it and that a test pop-up did not open. The current branch includes changes intended to address both, plus additional address-bar safeguards, but the [subsequent simulator job](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43731049684) and [browser job](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43731049689) stopped before any job steps started. GitHub reported that the job did not start because recent account payments failed or the spending limit needs to be increased; the message does not distinguish which condition applies. The later results are recorded above.
- [Expanded earlier simulator run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43729613385): local fixture pages in two web windows accepted taps and text entry, shared a test cookie, and retained it after app termination and relaunch. This did not use provider credentials.
- [Service entry-page observations](docs/WEB_APP_COMPATIBILITY.md): Telegram showed a QR sign-in screen, YouTube a home page, and Gmail a Google sign-in screen; no account was authenticated. Other services have different or unverified outcomes.
- [iPhone 17 / iOS 27.2 simulator](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43727264485): two native browser views displayed local fixture pages side by side, shared a test cookie, and retained it after app termination and relaunch. The Telegram shortcut was redirected to a local test page in that test; this does **not** establish Telegram login compatibility. The existing browser window and resize test also passed.
- [Linux Chromium](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43727264420): core, desktop interactions and the new directory/window bridge tests passed.
- [Earlier unsigned iPhone device build](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43728265852): the Release iPhone target compiled and an IPA was packaged successfully before the latest fixes. The IPA is unsigned and cannot be installed without suitable signing and provisioning; it is not a build of the latest candidate.
- The earlier three-device simulator results below apply to the previous prototype, not this web-app update. Sign-in to real services, HDMI, USB and Bluetooth hardware still need testing.
- The experimental OS uses a third-party v86 page and an OS image; prior research showed a graphical guest on the simulator, while guest input and persistence remain unresolved.


## Apple iOS Simulator

GitHub Actions [run 13](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43159202596) built the app and ran the full UI suite on GitHub-hosted Macs. The tested code commit is `dc5f15d8e7759736e156c3aad8f6d4098acc7e58`. All six tests passed on each simulated iPhone.

| Check | iPhone 16e / iOS 26.2 | iPhone 17 / iOS 27.2 | iPhone 18 Pro / iOS 27.2 |
| --- | --- | --- | --- |
| Desktop fills landscape screen | Passed | Passed | Passed |
| Calculator and left snap | Passed | Passed | Passed |
| Notes typing, minimize and restore | Passed | Passed | Passed |
| Notes right-edge resize | Passed | Passed | Passed |
| Snap Notes and Calculator side by side, then edit Notes | Passed | Passed | Passed |
| Browser loads a page, stays below the address bar and resizes from its right edge | Passed | Passed | Passed |
| **Total** | **6/6** | **6/6** | **6/6** |

An earlier [run 11](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43157803429) exposed a browser overlap after the on-screen keyboard closed. The app now waits for keyboard dismissal and resynchronizes its native browser view; run 13 verified the correction above. The browser test fetches an external page, so a network or site outage can cause that check to fail. It should eventually use a controlled local fixture as well as an optional network smoke test.

These runs cover two iOS major versions, not iOS 18, and do not cover an iPad or physical hardware. Actual Simulator screenshots and `.xcresult` bundles are available in the workflow artifacts. The `screenshots/` folder contains earlier Linux WebKit previews.

## Browser and logic checks

- JavaScript core: 11/11 passed locally after the most recent code changes.
- An earlier prototype passed 15/15 desktop interaction tests in Linux WebKit, 15/15 in Firefox, and 3/3 phone-sized WebKit profile tests. Those were browser emulations, not Apple simulators or hardware. A fresh local Chromium run could not start because this environment denied a required browser socket; no browser test cases executed in that attempt.
- Simulator tests use simulated touch and keyboard events. They do not establish compatibility with a particular USB or Bluetooth mouse, keyboard, hub or display.

## Remaining validation

1. On real iPhones, test USB and Bluetooth mouse/keyboard, a compatible hub, external display, rotation and performance.
2. Test iOS 18 on an available supported device or runtime, iPad layouts, file picker, browser popups/sign-in, and additional window operations.
3. Test physical-keyboard shortcuts and browser interaction after moving or switching windows; replace the UI test's external-page dependency with a controlled fixture plus an optional network smoke test.
4. Build a signed device app and assess distribution. No signed release or App Store approval is represented here.

Samsung DeX offers system-wide integration that an ordinary iOS app cannot reproduce. See `DEX_FEATURE_COMPARISON.md` for the detailed feature comparison.
