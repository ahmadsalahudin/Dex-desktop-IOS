// Research only: run the public Pocket Desktop preview with an embedded v86 guest.
// This uses Linux Playwright WebKit, not a real iPhone or the native iOS app.
const { webkit } = require('playwright');
const fs = require('node:fs');

(async () => {
  fs.mkdirSync('web-test-artifacts', { recursive: true });
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1179, height: 550 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto('https://pocket-desktop-iphone-demo.salahudin.chatgpt.site/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByRole('button', { name: 'Open Browser', exact: true }).first().click({ timeout: 20000 });
    await page.getByLabel('Web address or search').fill('https://copy.sh/v86/?profile=buildroot');
    await page.getByRole('button', { name: 'Go', exact: true }).click();
    const screen = page.frameLocator('iframe[title="Website preview"]').locator('#screen_container');
    await screen.waitFor({ state: 'visible', timeout: 60000 });
    let guestText = '';
    for (let attempt = 0; attempt < 60; attempt++) {
      guestText = await screen.innerText();
      if (guestText.includes('Files send via emulator appear in /mnt/') && guestText.includes('~%')) break;
      await page.waitForTimeout(2000);
    }
    await screen.evaluate(node => { document.body.style.zoom = '0.55'; node.scrollIntoView({ block: 'end' }); });
    await page.screenshot({ path: 'web-test-artifacts/public-preview.png', fullPage: false });
    console.log('Guest screen tail:', guestText.replace(/\s+/g, ' ').slice(-1100));
    if (!guestText.includes('Files send via emulator appear in /mnt/') || !guestText.includes('~%')) {
      throw new Error('Linux guest shell was not observed in the public web preview');
    }
    console.log('PASS: Buildroot guest shell appeared in the Linux WebKit iframe. No iPhone hardware was tested.');
  } catch (error) {
    await page.screenshot({ path: 'web-test-artifacts/public-preview-failure.png' }).catch(() => {});
    console.error('Page errors:', errors.slice(0, 10));
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
