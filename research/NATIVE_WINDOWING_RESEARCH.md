# Native iPhone windowing research

Research date: 2026-11-13. This is an isolated feasibility spike, not an installable release.

## The goal and the current app

Pocket Desktop's main branch provides resizable windows for its own tools in a WKWebView. It does not place arbitrary installed iPhone apps in those windows. Connecting an external display and using real USB/Bluetooth accessories have not been verified on an iPhone. A normal developer signature does not confer Apple's private FrontBoard permissions.

The actual goal is a phone connected to a monitor, mouse and keyboard with real installed iPhone apps in movable/resizable windows. This requires substantially more than reusing the existing desktop interface.

## Candidate approaches

| Approach | Source evidence | Main prerequisite and outstanding question |
| --- | --- | --- |
| System window manager | [TrollPad](https://github.com/khanhduytran0/TrollPad) injects hooks into SpringBoard and other processes. [TrollPadEx iOS 26 report](https://github.com/hxhlb/TrollPadEx/blob/52bac516a7f9aae4195191951be9807e855a12ee/docs/IOS26.md) describes Calculator and Notes in native windows on an iOS 26.1 virtualized research system. | Requires a compatible privileged injection/jailbreak environment. The author's iOS 26 report does not establish physical iPhone, external-display, or long-running stability. This is not a regular iOS app. |
| Device capability override | [Erosion](https://github.com/jailbreakdotparty/Erosion/tree/585a24a973d1ffa33bb71e48eab59a79cca505e1) has an iPadOS UI toggle and a separately gated Stage Manager toggle. It uses [worse_query](https://github.com/forcequitOS/worse_query) to modify a system capability cache. | Its author lists iOS 27.0–27.2.1 and iOS 27.3 beta 1 for the tool; the author says its iOS 26 exploit cannot write the cache needed for this feature. We did not verify the feature, hardware support, combined toggles or HDMI desktop. This sandbox escape alone does not establish the FrontBoard entitlements required by the next approach. |
| App scene host | [FrontBoardAppLauncher](https://github.com/khanhduytran0/FrontBoardAppLauncher/tree/fe304c66b87e9bd77896366f234dfadae01df0b6) launches other processes and embeds their private FrontBoard scenes, then provides resize handles. It is an actual installed-app hosting experiment. | Requests restricted Apple entitlements and says it requires TrollStore. The author documents failures with some single-scene apps, keyboard focus, relaunching, and process lifetime. Its stated iOS 15+ range is not proof of installability on current iOS; consult [TrollStore's version list](https://github.com/opa334/TrollStore). |

The Erosion UI warns that iPadOS mode may make apps or device features unusable, and that certain combinations can soft-brick the device. Its developer also says not to use the mode with an alphanumeric passcode. This is not appropriate to install on the gift recipient's everyday phone as it stands.

## GitHub Mac experiments

The research workflow is `.github/workflows/research-native-window-spike.yml` on the research branch. It uses pinned upstream commits and executes in an ephemeral GitHub-hosted Mac. No phone was changed and no installable release was created.

The completed [baseline run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43400661856) established:

1. Two TrollPadEx host-only Objective-C contract checks passed. One dock test passed as supplied; another initially failed to link because the fixture omitted three policy symbols. With stubs that trap if called, both dock tests passed. These are host mocks, not iOS runtime tests.
2. Erosion built for the iPhone arm64 target with Xcode signing disabled, and the executable was confirmed to exist. This says nothing about installability or whether any exploit or toggle works.
3. FrontBoardAppLauncher compiled and linked for arm64 with Theos and `ldid` on the Mac runner. `ldid` is not an Apple-issued distribution signature and does not grant the private entitlements on stock iOS.

The research branch also contains a small [experimental lifecycle patch](frontboard/close-window-no-force-kill.patch), plus a [host-only behavioral fixture](frontboard/verify_close_lifecycle.py). The upstream `closeWindow` sends SIGTERM to the app process and schedules SIGKILL, despite acknowledging that other scenes may exist. The patch removes those signals; it does not solve scene cleanup, keyboard focus, or running-process management. It may leave a process or scene alive and must not be treated as a production fix. The harness replaces process signalling with a counter and tests the real extracted method against mock scene/presenter objects; it does not exercise iOS. In the [patched research run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43401338697), the upstream method produced one intercepted signal, the patched method produced none, and the patched launcher compiled and linked for arm64.

FrontBoardAppLauncher is Apache-2.0 licensed; its license is reproduced at [frontboard/UPSTREAM_LICENSE](frontboard/UPSTREAM_LICENSE). No explicit license file was located for the reviewed TrollPad repositories; their source is only checked out temporarily for research, not copied into this repository. Erosion is GPL-3.0; it is also only checked out temporarily for research.

## Next meaningful validation gate

1. Obtain the intended phone's exact model and iOS version, and confirm whether its connector supports wired video output. Compatibility must be assessed for that combination rather than inferred from the major iOS number.
2. Investigate a disposable virtual iOS environment before touching a physical phone. [Corellium](https://support.corellium.com/devices/ios) offers cloud iOS devices with a research jailbreak, but exact OS, device, plan, graphics and private API support must be confirmed. Its virtualized results would not validate real HDMI, USB/Bluetooth peripherals, or a consumer install path. Its [trial](https://cellebrite.com/en/products/corellium/trial/) is subject to approval, generally lasts 14 days, needs no card during the trial, and the Solo trial is restricted to students.
3. If a compatible virtual environment is available, test two actual sample apps: launch, concurrent display, resizing, focus, text entry, window close and reopen, and process behavior. Record all OS/build versions and failures. Do not assume a virtual jailbreak provides the same privileges as an exploit on stock hardware.
4. Only after that, a consenting tester with a fully backed-up spare physical phone would need to verify boot/recovery, external display, mouse, keyboard, power, and daily stability. A current signing/install route for the exact device remains a separate prerequisite.

## Explicit non-claims

- No real iPhone, HDMI display, USB hub, Bluetooth keyboard or mouse was tested in this spike.
- No privileged source was integrated into the production Pocket Desktop app.
- We have not established a safe one-tap installation path or an iOS 18/26/27 device-compatibility matrix.
- Erosion, TrollPadEx, and the app-scene launcher are separate approaches with distinct prerequisites; they have not been shown to work together.
