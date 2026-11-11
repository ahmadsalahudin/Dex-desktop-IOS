# Samsung DeX vs Pocket Desktop — feature comparison

**Date:** 11 November 2026. This compares Samsung DeX on compatible Galaxy devices with the current Pocket Desktop prototype. Samsung's exact features vary by Galaxy model, One UI version, connection, region, and app. **Implemented** means present in the prototype's code; unless stated otherwise, our tests were browser tests, not iOS Simulator or real-iPhone tests. The project has not been compiled on macOS yet.

## Device, display and input

| Capability | Samsung DeX | Pocket Desktop now | Practical difference |
| --- | --- | --- | --- |
| Device platform | Supported Galaxy phones/tablets | iPhone/iPad project configured for iOS/iPadOS 16+ | Native build and target-device compatibility remain unverified. |
| Desktop on a larger screen | Desktop mode on supported external monitors/TVs | iPhone system mirroring is intended | Current project mirrors its view; it has no custom independent display scene. |
| Wired display | Supported Galaxy devices/cables/hubs | iOS mirroring via supported phone and adapter | iPhone 16e/17e are exceptions to Apple's listed USB-C display-output support; hardware untested. |
| Wireless display | Wireless DeX on compatible Miracast displays | Intended iPhone AirPlay mirroring | AirPlay and Miracast are different protocols; neither has been tested with this project. |
| Use phone separately while desktop is shown | Supported on applicable DeX devices | No separate phone/desktop implementation | iOS can display app-specific noninteractive content on a second screen; building a phone controller for it is a possible future experiment, not implemented. |
| Phone as touchpad | Supported on compatible phones | No dedicated touchpad | Could be explored with a custom second-screen scene and app-controlled input; not the same as system-wide DeX. |
| USB mouse | Supported with compatible Galaxy setup | Pointer events implemented; iOS can use wired pointers with AssistiveTouch | No physical mouse or hub test yet. |
| Bluetooth mouse | Supported | Pointer events implemented; iOS can use Bluetooth pointers with AssistiveTouch | No Bluetooth hardware test yet. |
| USB/Bluetooth keyboard | Supported | Text fields and selected shortcuts implemented | Hardware input and iOS shortcut interception not tested. |
| Touch and landscape | Touchpad/touch support depends on model; DeX interface is desktop-oriented | Landscape-only iOS configuration; touchscreen web-profile tests passed | Native orientation remains unverified. |
| External display resolution and aspect ratio | DeX negotiates modes on compatible hardware | Current iPhone mirror follows system behavior | No separate 16:9/4K desktop or adjustable display-resolution control. |

## Desktop and window management

| Capability | Samsung DeX | Pocket Desktop now | Practical difference |
| --- | --- | --- | --- |
| Desktop wallpaper and icons | Yes | Yes, six built-in desktop shortcuts and three wallpapers | No custom photos or icon rearrangement. |
| App drawer and search | Lists installed apps | Searchable drawer of seven built-in tools | It cannot enumerate or host arbitrary installed iPhone apps. |
| Taskbar, pinned and running apps | Yes | Four fixed pinned tools and open-window indicators | Pins are not customizable. |
| Multiple floating windows | Yes, with limits depending on device/version | Yes, one window per built-in tool | No multiple instances of the same tool. |
| Drag window | Yes | Implemented and browser-tested | Touch and real hardware on iOS still need testing. |
| Resize window | Supported per app; some Android apps have fixed sizing | All seven built-in windows, eight edges/corners, browser-tested | Third-party iPhone apps cannot be resized within the workspace. |
| Minimize, restore, maximize, close | Yes | Yes; browser-tested | Native iOS UI still unverified. |
| Snap left/right | Supported on applicable versions | Yes, buttons and a shortcut; browser-tested | Exact shortcuts and behavior can differ. |
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
| Desktop-class web browser | Available via compatible Android browsers | A separate native WKWebView is implemented; browser preview uses iframe | Native view has not been built/tested; it currently hides when another window receives focus, and some sites restrict in-app browsers or logins. |
| Browser back/forward/reload | Supported by browser app | Implemented for native WKWebView; reload only in browser preview | Native functionality unverified; no tab manager. |
| System file manager | Galaxy My Files and compatible apps | Choose one local file; preview text (up to 1 MB) or an image | No folder browsing, create/move/delete, or persistent imported-file library. |
| Notes | Available through installed notes apps | One plain-text note saved using local browser storage when available | Native persistence and recovery unverified; no multi-note editor, sync, or export. |
| Calendar | Available through installed calendar apps | Month/date viewer | No events, accounts or reminders. |
| Calculator | Available through installed app | Basic arithmetic, percent, keyboard input | Not a scientific calculator. |
| Photos/gallery | Galaxy Gallery and supported apps | Image preview from a chosen file | No photo-library browser, editing or album management. |
| System notifications | DeX notification integration | No | iOS notifications remain under iOS control. |
| Wi-Fi/Bluetooth/brightness/sound controls | DeX quick/settings controls | No system controls; app menu links to wallpaper/help | iOS Settings/Control Center remains the system surface. |
| Battery, connection, sound indicators | DeX status area | Clock/date only | No verified live system status indicators. |
| Phone calls, messaging and contacts | Via Galaxy/system apps where supported | Not provided | Must use the iPhone's own apps outside this workspace. |
| Cloud sync and account integration | Through compatible Galaxy/Android apps | No built-in account or sync | No cross-device notes or files. |
| Screen lock and security | Device/system DeX lock behavior | No separate secure lock | Use iOS device lock; the prototype does not implement its own security boundary. |
| Third-party app installation | Galaxy/Android ecosystem | No installer or App Store integration | A standalone prototype, not a new iOS app platform. |
| macOS/iOS build and installation | Samsung distributes DeX as part of supported Galaxy experience | Xcode project and unrun GitHub Mac/Simulator workflows | No signed IPA or verified App Store release exists. |

## Test evidence and next actions

- Current browser work has run in Linux WebKit and Firefox, including phone-sized touch emulation and automated keyboard/mouse-style events. These are **not** physical devices, Apple Safari on iOS, or the Apple iOS Simulator.
- The native WKWebView bridge, landscape lock, iOS file picker, on-screen keyboard, external monitor, USB/Bluetooth peripherals, and actual iOS device support remain to be tested on an Apple Simulator or device. Physical USB/Bluetooth and real external-display compatibility require real hardware.
- The first priority is a Mac runner with an iOS Simulator: build, launch, exercise the UI and native browser, inspect logs/screenshots, fix failures, and repeat. The included GitHub Actions workflow is configured for an isolated repository but has not run.
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
