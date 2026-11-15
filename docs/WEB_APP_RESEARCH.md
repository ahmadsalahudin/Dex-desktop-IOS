# Web apps and experimental desktop OS

Research and implementation work, 15 November 2026. The shortcuts in this prototype are links to websites; inclusion does not certify that a particular iPhone, browser, account, sign-in flow, or service feature works.

## Intended experience

Open common services in individually resizable app windows. Each web view uses the persistent iOS website data store, so a site can keep its own cookies and data between launches. Each provider retains control over sign-in, expiry and device linking; there is no single login for all services. Passwords are entered into the website, not collected by the Pocket Desktop interface. Ordinary iOS sandbox restrictions remain in force: this does not embed installed iPhone apps.

## What public documentation establishes

| Category | Services included as web links | Evidence and constraints |
|---|---|---|
| Messaging | WhatsApp, Telegram, Messenger, Discord | [WhatsApp](https://faq.whatsapp.com/378279804439436/) supports a linked web device, with limits and reauthentication rules. [Telegram](https://telegram.org/apps?filter=web) offers official Web A and Web K. Whether either works within this WKWebView and its actual linking flow is unverified. |
| Social | Facebook, Instagram, TikTok, X, Reddit, LinkedIn, Pinterest | Public websites exist; account login, messaging, uploads, notifications and small-window layouts are unverified in this app. |
| Mail and productivity | Gmail, Outlook, Google Drive/Docs/Sheets/Calendar, Microsoft 365, OneDrive, Notion, Slack, Canva | [Microsoft](https://support.microsoft.com/en-us/accounts-billing/subscriptions/what-s-the-difference-between-a-microsoft-365-subscription-and-free-web-apps) describes free web versions of Office apps. Google states that [embedded webviews are blocked for Google OAuth authorization](https://developers.google.com/identity/protocols/oauth2/resources/best-practices), and [may reject account sign-in in embedded browsers](https://support.google.com/accounts/answer/7675428?hl=en). Whether a particular provider's entire flow works in this app is unverified. |
| Media and other | YouTube, Spotify, Google Maps, ChatGPT | [YouTube](https://support.google.com/youtube/answer/2398242?co=GENIE.Platform%3DiOS&hl=en) documents a mobile web experience; [Spotify](https://support.spotify.com/us/article/web-player-help/) documents an iOS Safari web player, not a guarantee of third-party WKWebView playback or DRM support. |
| Local experimental OS | KolibriOS using v86 | [Prior research](https://github.com/ahmadsalahudin/Dex-desktop-IOS/blob/research/embedded-os-spike-20261115/research/embedded-os/README.md) displayed a guest desktop in an iPhone 17 simulator. Input, speed, persistent storage, and physical hardware are not established. The page and image are provided by a third party and require a network connection to load. It is not Windows. |

Provider websites can change or block embedded browsers, iframe previews, features, account linking, popups, or media. An alternative that opens the page in the system browser is available, but that browser may have separate website data and may not carry over a WKWebView login. Use the provider's official sign-in flow; no bypass is attempted. An authenticated real-device test is still needed for every service we wish to claim as working.

## Implementation notes

A web service runs in its own top-level WKWebView rather than an iframe. It has no native script bridge; only the bundled desktop's main frame can send native window commands. The native shell owns all web-view instances and positions them using the window geometry sent from the desktop. Higher windows must cover lower web-view regions, and closing one window must not destroy the website data store used by other views.

Browser-only preview uses iframes and is much more likely to be blocked by third-party frame restrictions. Neither the preview nor the simulator replaces physical iPhone, HDMI, USB or Bluetooth testing. No software release or signed IPA is produced by this research branch.
