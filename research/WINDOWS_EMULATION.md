# Windows iOS emulation research and handoff

Date: 2026-11-13. The current research session runs in a Linux cloud workspace; it does not have an established connection to the user's Windows laptop. Nothing in this document was installed or run on that laptop during this session.

## Goal

Find an isolated research environment where we can test actual installed iOS apps in resizable windows. Pocket Desktop itself remains a normal app and does not host the phone's installed apps. The candidate emulators below do not establish a consumer installation method or prove the result on a physical phone.

## Candidates inspected

| Candidate | What the developer reports | What remains unknown |
| --- | --- | --- |
| [MRHRTZ/ios-emulator](https://github.com/MRHRTZ/ios-emulator/tree/d3b4ae41f2e388a42c918a78cf3269db871b35a8) | A Windows QEMU research environment displaying real iOS 16.7.16 user space with a patched open-source XNU kernel. Reports an interactive home screen and Settings. | The code is experimental, uses iPhone X/iOS 16 rather than the recent target, has incomplete app support and software graphics, and Safari content may be blank. Kernel and root image setup are not packaged. Running FrontBoardAppLauncher or TrollPadEx, an external display, and current iOS have not been demonstrated. |
| [zaidanfaiz/ios-emulator](https://github.com/zaidanfaiz/ios-emulator/tree/8d8ac69a4af10828d8399db640bbc5f18c6d4111) | An iOS 16.5 user-space research environment for x86 Linux/WSL2 using QEMU software translation and an open XNU kernel. | Full graphical iOS is still experimental. The README describes substantial first-boot time, about 7.4 GB in downloaded iOS components and roughly 25 GB of disk space. It is not a modern-iOS compatibility test. |
| [UltraFEmotes/iPhone-VM](https://github.com/UltraFEmotes/iPhone-VM) / [Inferno](https://github.com/ChefKissInc/Inferno) | An experimental WSL2 wrapper for a different QEMU iPhone emulator. The developer reports iOS 18.5 as experimental. | The wrapper author says the Windows build was not tested on real Windows and newer iOS versions may fail. The release notes say only iOS 14 can use the included jailbreak path. It is not an established Windows/iOS 18 desktop test. |
| [darwin-vm](https://github.com/jprx/darwin-vm) | Boots selected modern Darwin/iOS kernels to a command-line root shell. | The developer explicitly says GUI apps, graphics, full SpringBoard and the screen are not supported. It cannot test the requested desktop experience. |

All version support above is from the relevant project's own claims, not from tests on the user's laptop. Do not use a personal Apple ID or real data in these research environments.

## Tests run here

The [initial Windows and Linux research run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43425788294) checked out the pinned Windows project on a disposable GitHub Windows runner. All **61 upstream host-side tests** passed. These tests did not boot iOS. The separate Linux QEMU task initially failed because the runner lacked a firmware package.

After adding that package on a disposable Linux runner, the [QEMU open-kernel run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43426216073) reached a small test process, which printed its marker. The test process then exited and the kernel panicked; the upstream README describes that panic as expected for this minimal test. This did not load Apple user space, SpringBoard, the actual app, or a graphical iPhone. The workflow explicitly checks those markers and identifies the expected panic.

## Local continuation

If a local Work or Codex session is available, open this repository on the Windows computer and use branch `research/native-window-spike-20261113`. Read `research/NATIVE_WINDOWING_RESEARCH.md` and this document first. Inspect the machine's available storage, WSL, QEMU, virtualization and recent thermal constraints without modifying configuration. Verify a candidate's exact prerequisites and inspect any setup scripts before running them. Report download and disk needs and keep all images and modifications inside a dedicated research folder or VM.

The user previously reported elevated laptop CPU temperatures and an unexpected shutdown under a sustained workload. If this is the same machine, plan for that before a long software-emulation run; do not presume the hardware can sustain an ARM guest at full load. Do not change or flash a physical phone. Report each result as host test, kernel test, iOS UI test, or physical-device test, as appropriate.

## Minimal read-only Windows preflight

Run in PowerShell if local agent access is unavailable:

```powershell
Get-CimInstance Win32_ComputerSystem | Select-Object Model, @{Name='RAM_GB';Expression={[math]::Round($_.TotalPhysicalMemory/1GB,1)}}
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors
Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{Name='Free_GB';Expression={[math]::Round($_.Free/1GB,1)}}
wsl --list --verbose
```

The commands report hardware, free drive space and the local WSL distributions. They do not install software or modify Windows settings.
