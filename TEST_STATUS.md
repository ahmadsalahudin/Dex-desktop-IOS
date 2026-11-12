# Test status — 12 November 2026

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
