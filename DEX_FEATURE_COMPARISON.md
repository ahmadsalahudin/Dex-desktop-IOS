# Samsung DeX vs Pocket Desktop — feature comparison

**Date:** 12 November 2026. This compares Samsung DeX on compatible Galaxy devices with the current Pocket Desktop prototype. Samsung's exact features vary by Galaxy model, One UI version, connection, region, and app. **Implemented** means present in the prototype's code. The app has been built and exercised in Apple iOS Simulator; specific results and unresolved issues are recorded in `TEST_STATUS.md`. No physical iPhone has been tested.

## Device, display and input

| Capability | Samsung DeX | Pocket Desktop now | Practical difference |
| --- | --- | --- | --- |
| Device platform | Supported Galaxy phones/tablets | iPhone/iPad project configured for iOS/iPadOS 16+ | Simulator builds have run on iPhone 16e, 17 and 18 Pro profiles; physical-device compatibility remains unverified. |
| Desktop on a larger screen | Desktop mode on supported external monitors/TVs | iPhone system mirroring is intended | Current project mirrors its view; it has no custom independent display scene. |
| Wired display | Supported Galaxy devices/cables/hubs | iOS mirroring via supported phone and adapter | iPhone 16e/17e are exceptions to Apple's listed USB-C display-output support; hardware untested. |
| Wireless display | Wireless DeX on compatible Miracast displays | Intended iPhone AirPlay mirroring | AirPlay and Miracast are different protocols; neither has been tested with this project. |
| Use phone separately while desktop is shown | Supported on applicable DeX devices | No separate phone/desktop implementation | iOS can display app-specific noninteractive content on a second screen; building a phone controller for it is a possible future experiment, not implemented. |
| Phone as touchpad | Supported on compatible phones | No dedicated touchpad | Could be explored with a custom second-screen scene and app-controlled input; not the same as system-wide DeX. |
| USB mouse | Supported with compatible Galaxy setup | Pointer events implemented; iOS can use wired pointers with AssistiveTouch | No physical mouse or hub test yet. |
| Bluetooth mouse | Supported | Pointer events implemented; iOS can use Bluetooth pointers with AssistiveTouch | No Bluetooth hardware test yet. |
| USB/Bluetooth keyboard | Supported | Text fields and selected shortcuts implemented | Hardware input and iOS shortcut interception not tested. |
| Touch and landscape | Touchpad/touch support depends on model; DeX interface is desktop-oriented | Landscape-only iOS configuration; landscape launch observed in all three simulators | Physical iPhone orientation remains unverified. |
| External display resolution and aspect ratio | DeX negotiates modes on compatible hardware | Current iPhone mirror follows system behavior | No separate 16:9/4K desktop or adjustable display-resolution control. |

## Desktop and window management

| Capability | Samsung DeX | Pocket Desktop now | Practical difference |
| --- | --- | --- | --- |
| Desktop wallpaper and icons | Yes | Yes, six built-in desktop shortcuts and three wallpapers | No custom photos or icon rearrangement. |
| App drawer and search | Lists installed apps | Searchable drawer of eight built-in tools plus a directory of 26 web-service shortcuts | It cannot enumerate or host arbitrary installed iPhone apps. |
| Taskbar, pinned and running apps | Yes | Five fixed pinned tools and open-window indicators | Pins are not customizable. |
| Multiple floating windows | Yes, with limits depending on device/version | Yes, one window per built-in tool or web shortcut; two separate web views showed local test pages side by side on iPhone 17 Simulator | No multiple instances of the same tool. |
| Drag window | Yes | Implemented and browser-tested | Touch and real hardware on iOS still need testing. |
| Resize window | Supported per app; some Android apps have fixed sizing | The previous built-in windows and eight edges/corners were browser-tested; web windows reuse the same controls and two were snapped on iPhone 17 Simulator | Third-party iPhone apps cannot be resized within the workspace. |
| Minimize, restore, maximize, close | Yes | Implemented; Notes minimize and restore passed on all three iPhone simulators | Maximize and close have not yet been verified in native UI tests. |
| Snap left/right | Supported on applicable versions | Yes, buttons and a shortcut; left and right snapping passed on all three iPhone simulators | Exact shortcuts and physical-keyboard behavior can differ. |
| Show desktop | Yes/varies by DeX version | Yes; browser-tested | Minimizes this app's windows only. |
| Right-click desktop menu | Yes | Wallpaper, Show desktop, and help; browser-tested | No icon organization or uninstall menu. |
| Alt+Tab / Alt+F4 | Supported by Samsung on applicable versions | Implemented when keyboard events reach the workspace; browser-tested | iOS or hardware may intercept these shortcuts; native behavior unknown. |
| Recent apps / window overview | DeX recents and taskbar | Running-window taskbar icons only | No separate overview or thumbnails. |
| Multiple workspaces | Available on some current Galaxy tablet/DeX combinations | No | Not implemented. |
| Drag-and-drop between apps/windows | Supported for compatible apps | No application-to-application file drag-and-drop | Standard text selection/clipboard behavior depends on iOS/WebKit and is not verified here. |

## Apps, files and system integration

| Capability | Samsung DeX | Pocket Desktop now | Practical difference |
| --- | --- | --- | --- |
| Existing mobile apps in desktop windows | Supported Android apps; compatibility varies | No | A regular iOS app cannot embed and control arbitrary installed apps as its own windows. |
| Desktop-class web browser | Available via compatible Android browsers | Separate native WKWebViews can appear in multiple workspace windows; browser preview uses iframes | Two native views loaded local test pages side by side in the iPhone 17 simulator. Actual site login and hardware behavior vary and remain unverified. |
| Browser back/forward/reload | Supported by browser app | Implemented for native WKWebView; reload only in browser preview | Native functionality unverified; no tab manager. |
| System file manager | Galaxy My Files and compatible apps | Choose one local file; preview text (up to 1 MB) or an image | No folder browsing, create/move/delete, or persistent imported-file library. |
| Notes | Available through installed notes apps | One plain-text note saved using local browser storage when available; typing and minimize/restore passed on three iPhone simulators | Storage persistence across a fresh launch and recovery remain unverified. No multi-note editor, sync, or export. |
| Calendar | Available through installed calendar apps | Month/date viewer | No events, accounts or reminders. |
| Calculator | Available through installed app | Basic arithmetic, percent, keyboard input; 8 × 7 passed on all three simulators | Not a scientific calculator. |
| Photos/gallery | Galaxy Gallery and supported apps | Image preview from a chosen file | No photo-library browser, editing or album management. |
| System notifications | DeX notification integration | No | iOS notifications remain under iOS control. |
| Wi-Fi/Bluetooth/brightness/sound controls | DeX quick/settings controls | No system controls; app menu links to wallpaper/help | iOS Settings/Control Center remains the system surface. |
| Battery, connection, sound indicators | DeX status area | Clock/date only | No verified live system status indicators. |
| Phone calls, messaging and contacts | Via Galaxy/system apps where supported | Not provided | Must use the iPhone's own apps outside this workspace. |
| Cloud sync and account integration | Through compatible Galaxy/Android apps | No built-in account or sync | No cross-device notes or files. |
| Screen lock and security | Device/system DeX lock behavior | No separate secure lock | Use iOS device lock; the prototype does not implement its own security boundary. |
| Third-party app installation | Galaxy/Android ecosystem | No installer or App Store integration | A standalone prototype, not a new iOS app platform. |
| macOS/iOS build and installation | Samsung distributes DeX as part of supported Galaxy experience | Xcode project built and launched on GitHub-hosted iOS Simulators | No signed IPA or verified App Store release exists. |

## Test evidence and next actions

- Current browser work has run in Linux WebKit and Firefox, including phone-sized touch emulation and automated keyboard/mouse-style events. These are **not** physical devices, Apple Safari on iOS, or the Apple iOS Simulator.
- Landscape launch, full-screen layout, Notes editing and right-edge resize, minimize/restore, calculator, side-by-side snapping, and native Browser page loading, alignment and right-edge resizing passed on all three iPhone simulators. Remaining controls and device-specific behavior require the additional checks in `TEST_STATUS.md`. Physical USB/Bluetooth and external-display compatibility require real hardware.
- The GitHub Actions workflow has run on hosted Macs. Further test iterations and hardware validation are needed; see `TEST_STATUS.md` for the current result.
- On iPhone, Apple's separate external-display scene is noninteractive by default. A second-screen interface controlled from the phone is a possible app-specific direction; it does not grant this app control over other installed iPhone applications.

## Primary sources

1. [Samsung: How DeX works](https://developer.samsung.com/samsung-dex/how-it-works.html)
2. [Samsung: Keyboard and mouse with DeX](https://www.samsung.com/us/support/answer/ANS10003477/)
3. [Samsung: Access and manage apps in DeX](https://www.samsung.com/us/support/answer/ANS10002880/)
4. [Samsung: Use DeX and the phone touchpad](https://www.samsung.com/us/support/answer/ANS10001955/)
5. [Samsung: Notifications in DeX](https://www.samsung.com/us/support/answer/ANS10002878/)
6. [Apple: Present content on a connected display](https://developer.apple.com/documentation/uikit/presenting-content-on-a-connected-display)
7. [Apple: Connect iPhone using USB-C](https://support.apple.com/en-gb/105099)
8. [Apple: Use a wired or Bluetooth pointer](https://support.apple.com/en-in/111775)
9. [Apple: Open a URL and foreground the handling app](https://developer.apple.com/documentation/uikit/uiapplication/open%28_%3Aoptions%3Acompletionhandler%3A%29)
