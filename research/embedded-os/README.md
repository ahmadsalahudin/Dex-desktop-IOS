# Running another OS from Pocket Desktop: research

Research date: 2026-11-15. This branch contains an experiment and is not an iPhone release.

## What was tested

Pocket Desktop already contains one resizable native `WKWebView` browser window. We used a temporary, instrumented simulator build to open the public [v86](https://github.com/copy/v86) web emulator in that browser. The emulator downloaded and ran the Buildroot Linux guest inside the web view.

The [iPhone 17 Simulator run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43677496049) reached a guest shell and returned `vmprobe` after a synthetic web keyboard sequence sent `echo vmprobe`. This is a real Linux guest console in the app's browser on the simulator. It is **not** a graphical desktop, a physical iPhone test, or proof that a USB/Bluetooth keyboard works. The app was not signed, installed on a phone or modified on the main branch.

The [first run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43676919207) reported a test failure: our initial assertion expected the wrong shell prompt. Its final log nevertheless showed that the guest reached its `~%` prompt. The second run corrected that detection and checked a command response.

The [graphical simulator run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43677758645) also displayed the KolibriOS desktop inside the native browser window. KolibriOS is a small independent OS, not Windows or Linux. A colorful frame was detected by the test and the screenshot was visually inspected; no graphical app launch, mouse, physical device, HDMI or Bluetooth support was established in that run.

The public preview browser tests reached the [Buildroot shell](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43678309472) and rendered the [KolibriOS desktop](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43678483549) in a nested browser iframe using Linux Playwright WebKit. The graphical screenshot was visually inspected. This was not Safari on a physical iPhone. To try it, open the [Pocket Desktop browser preview](https://pocket-desktop-iphone-demo.salahudin.chatgpt.site/), open its Browser window, and enter `https://copy.sh/v86/?profile=kolibrios-fallback`.

A [further simulator run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43678346910) captured before and after a test tap intended for KolibriOS's Menu. An iOS software keyboard appeared, so a working guest click or menu opening was not demonstrated. The automated test checked for a graphical frame, not a successful tap. Input handling remains unresolved.

The simulator-only scripts in this directory modify the checkout used by CI. They add a visible research label and emit synthetic keyboard events. They are not production instrumentation. The web VM and guest image come from the external v86 site, so the result depends on the site's availability and content. No guest persistence or offline capability was established.

## Potential directions

1. **Web apps in Pocket Desktop.** Continue using its existing embedded browser and add better ways to launch web versions of common apps. The current native wrapper owns one browser view. Website sign-in, pop-ups and iOS input must be verified individually.
2. **Local emulated OS inside a web view.** The v86 experiments show that a tiny text-mode Linux guest can execute a command and that the independent KolibriOS guest can display a graphical desktop on the simulator. Modern web browsing, graphical app interaction, data persistence, power use, memory usage, physical keyboard and mouse, and real iPhone speed remain separate tests. Small research guests are not a substitute for modern desktop Windows.
3. **Cloud desktop in a web view.** A secure HTML5 gateway such as [Apache Guacamole](https://guacamole.apache.org/) can display a remote Windows or Linux desktop in a browser. Multiple applications can run inside that remote desktop, but the phone still sees one remote display. It requires a VM, gateway, authentication, network access, and any required OS licences. No account was created and no cloud service was deployed in this research.
4. **Separate on-phone VM app.** [UTM SE](https://docs.getutm.app/installation/ios/) is available in the App Store without a jailbreak. Its non-JIT interpreter is intended for older or lightweight guests, and its device compatibility, input and speed need actual testing. It does not integrate automatically into Pocket Desktop.

An ordinary iOS app still cannot place arbitrary installed iPhone apps inside the guest or host them in resizable windows. The project remains unsigned for an actual phone.

## Hardware and costs

Apple lists iPhone 15, iPhone 16 except 16e, and iPhone 17 except 17e among the models supporting USB-C external displays. The exact iPhone model must be checked before purchasing an HDMI adapter. Pocket Desktop's current output mirrors the phone rather than creating an independent system desktop.

Microsoft advertises a time-limited free allowance for certain Windows VMs on eligible new Azure accounts, but image, region, storage, networking, licensing and the user's actual subscription must be checked before estimating cost. Free compute is not a promise that the whole setup costs nothing, or that it stays free indefinitely. The user previously mentioned Azure credits and an existing VPS; neither was accessed or modified in this experiment.

## Sources

- [v86 project and examples](https://github.com/copy/v86)
- [UTM on iOS](https://docs.getutm.app/installation/ios/)
- [Apple: iPhone USB-C external displays](https://support.apple.com/en-gb/105099)
- [Azure free Windows VM pricing](https://azure.microsoft.com/en-us/pricing/details/virtual-machines/windows/)
- [Apache Guacamole](https://guacamole.apache.org/)
