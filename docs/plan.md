# Pocket Desktop implementation plan

**Goal:** A DeX-inspired workspace for iPhone and iPad with useful built-in, draggable tools, plus a browser-based preview of the same interface.

**Architecture:** A dependency-free HTML/CSS/JavaScript desktop runs inside a native iOS WKWebView and in a normal web browser. The web files are bundled locally. A minimal native bridge opens external websites safely in an iOS browser sheet. iOS handles display mirroring; the app does not claim to run other iOS apps in its windows.

**Review focus:** Dragging and resizing without losing access to windows; minimize/restore; local persistence; useful offline tools; mobile touch and small-screen legibility; honest browser and display limitations; packaging for Xcode on a Mac.

- [x] Write browser-driven tests to specify opening, window management, persistence, calculator, and importing a file.
- [x] Implement the desktop and built-in apps. Core logic is tested; browser and visual tests are blocked in this environment.
- [x] Package the shared workspace in a native iOS Xcode project; document installation and display limitations.
- [x] Run available checks and document the native-build and browser-testing limits.
