# Web app shortcut inventory and compatibility

Last updated 15 November 2026. Each row is a website shortcut, not an installed iPhone app. A listed site is **not a guarantee** of login, feature, media playback, or physical-device compatibility. The web preview uses iframes and may fail for sites that render in the native app. No provider credentials were used in our tests. Simulator entry-page observations are from [this unauthenticated run](https://github.com/ahmadsalahudin/Dex-desktop-IOS/actions/runs/43728968480); screenshots show initial pages, not successful app use.

| Shortcut | Category | Web entry point | Current evidence / limitation |
|---|---|---|---|
| WhatsApp | Messages | [https://web.whatsapp.com/](https://web.whatsapp.com/) | WhatsApp landing page partially visible in iPhone 17 Simulator; account linking not tested. |
| Telegram | Messages | [https://web.telegram.org/k/](https://web.telegram.org/k/) | Telegram Web K showed a QR sign-in screen in iPhone 17 Simulator; account linking not tested. |
| Messenger | Messages | [https://www.messenger.com/](https://www.messenger.com/) | Page and account flow not yet verified in the native app. |
| Discord | Messages | [https://discord.com/app](https://discord.com/app) | Page and account flow not yet verified in the native app. |
| Facebook | Social | [https://www.facebook.com/](https://www.facebook.com/) | Page and account flow not yet verified in the native app. |
| Instagram | Social | [https://www.instagram.com/](https://www.instagram.com/) | Appeared blank after 17 seconds in one iPhone 17 Simulator run; cause and account behavior unverified. |
| TikTok | Social | [https://www.tiktok.com/](https://www.tiktok.com/) | Page and account flow not yet verified in the native app. |
| X | Social | [https://x.com/](https://x.com/) | Page and account flow not yet verified in the native app. |
| Reddit | Social | [https://www.reddit.com/](https://www.reddit.com/) | Page and account flow not yet verified in the native app. |
| LinkedIn | Social | [https://www.linkedin.com/](https://www.linkedin.com/) | Page and account flow not yet verified in the native app. |
| Pinterest | Social | [https://www.pinterest.com/](https://www.pinterest.com/) | Page and account flow not yet verified in the native app. |
| YouTube | Watch and listen | [https://www.youtube.com/](https://www.youtube.com/) | YouTube home page rendered in iPhone 17 Simulator; playback and sign-in not tested. |
| Spotify | Watch and listen | [https://open.spotify.com/](https://open.spotify.com/) | Spotify landing page rendered in iPhone 17 Simulator; account and DRM playback not tested. |
| Gmail | Email and work | [https://mail.google.com/](https://mail.google.com/) | Google sign-in page rendered in iPhone 17 Simulator; Google may reject embedded sign-in and login was not tested. |
| Outlook | Email and work | [https://outlook.live.com/mail/0/](https://outlook.live.com/mail/0/) | Microsoft landing page appeared in iPhone 17 Simulator; mailbox and login untested. |
| Google Drive | Email and work | [https://drive.google.com/](https://drive.google.com/) | Google may reject sign-in in an embedded web view; authenticated use is not verified. |
| Google Docs | Email and work | [https://docs.google.com/document/](https://docs.google.com/document/) | Google may reject sign-in in an embedded web view; authenticated use is not verified. |
| Google Sheets | Email and work | [https://docs.google.com/spreadsheets/](https://docs.google.com/spreadsheets/) | Google may reject sign-in in an embedded web view; authenticated use is not verified. |
| Google Calendar | Email and work | [https://calendar.google.com/](https://calendar.google.com/) | Google may reject sign-in in an embedded web view; authenticated use is not verified. |
| Microsoft 365 | Email and work | [https://www.microsoft365.com/](https://www.microsoft365.com/) | Microsoft offers free web apps; in-app account flow not tested. |
| OneDrive | Email and work | [https://onedrive.live.com/](https://onedrive.live.com/) | Page and account flow not yet verified in the native app. |
| Notion | Email and work | [https://www.notion.so/](https://www.notion.so/) | Page and account flow not yet verified in the native app. |
| Slack | Email and work | [https://app.slack.com/](https://app.slack.com/) | Page and account flow not yet verified in the native app. |
| Canva | Email and work | [https://www.canva.com/](https://www.canva.com/) | Page and account flow not yet verified in the native app. |
| Google Maps | Explore | [https://maps.google.com/](https://maps.google.com/) | Page and account flow not yet verified in the native app. |
| ChatGPT | Explore | [https://chatgpt.com/](https://chatgpt.com/) | Page and account flow not yet verified in the native app. |
| Desktop OS | Experimental | [https://copy.sh/v86/?profile=kolibrios-fallback](https://copy.sh/v86/?profile=kolibrios-fallback) | v86 controls and part of a KolibriOS graphical screen appeared on iPhone 17 Simulator; guest input and saving remain unverified. |

For platform documentation and the simulator test record, see [WEB_APP_RESEARCH.md](WEB_APP_RESEARCH.md). Providers can change their behavior, and a real sign-in must be tested with the intended account on the intended device.
