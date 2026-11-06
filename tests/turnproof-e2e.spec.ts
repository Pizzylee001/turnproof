import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'laptop-1024', width: 1024, height: 768 },
  { name: 'desktop-1440', width: 1440, height: 900 },
];

const ROUTES = ['/', '/studio', '/verify', '/ledger'];

test.describe('TurnProof 4-Route Multi-Viewport Verification', () => {
  for (const vp of VIEWPORTS) {
    test(`renders all 4 routes cleanly without horizontal overflow at ${vp.name} (${vp.width}x${vp.height})`, async ({
      page,
    }) => {
      const consoleErrors: string[] = [];
      page.on('pageerror', (err) => consoleErrors.push(err.message));

      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ROUTES) {
        const res = await page.goto(route, { waitUntil: 'networkidle' });
        expect(res?.status()).toBe(200);

        const h1Count = await page.locator('h1').count();
        expect(h1Count).toBe(1);

        const overflow = await page.evaluate(() => {
          return (
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth
          );
        });
        expect(overflow).toBe(false);
      }

      expect(consoleErrors).toEqual([]);
    });
  }

  test('executes interactive prompt compilation, millisecond barge-in slicing, and ledger export across real routes', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // 1. Visit Stage (/) and navigate to Studio (/studio)
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Prove every spoken turn');
    await page.click('#stage-compile-open-studio-btn');
    await expect(page).toHaveURL(/\/studio$/);

    // 2. Verify sanitizer output on /studio
    await expect(page.locator('#studio-compiled-output')).toContainText(
      '4-9-3-A'
    );
    await expect(page.locator('#studio-compiled-output')).not.toContainText(
      '[pause]'
    );

    // 3. Step barge-in cut-line and verify heard_text & JSON update
    const beforeCutLabel = await page
      .locator('#studio-active-cut-ms-readout')
      .textContent();
    await page.click('#studio-step-cut-back-btn');
    const afterCutLabel = await page
      .locator('#studio-active-cut-ms-readout')
      .textContent();
    expect(afterCutLabel).not.toBe(beforeCutLabel);

    const jsonText = await page
      .locator('#studio-patched-json-pre')
      .textContent();
    expect(jsonText).toContain('"role": "assistant"');
    expect(jsonText).toContain('"withheldEntities"');

    // 4. Navigate to /verify and inspect Universal-3.5 Pro readback
    await page.click('#studio-to-verify-link');
    await expect(page).toHaveURL(/\/verify$/);
    await expect(page.locator('#verify-active-transcript')).toContainText(
      'Alliance Appliance Repair'
    );

    // 5. Navigate to /ledger and verify Bug Bounty markdown packet
    await page.click('#verify-to-ledger-link');
    await expect(page).toHaveURL(/\/ledger$/);
    await expect(page.locator('#ledger-bounty-markdown-pre')).toContainText(
      'assemblyai-tts-1'
    );
  });
});
