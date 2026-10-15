import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

for (const width of [360, 768, 1366]) {
  test(`public pages are accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['/', '/about', '/contact', '/privacy', '/terms', '/not-a-page']) {
      await page.goto(route);
      await expect(page.locator('h1')).toBeVisible();
      await expect(page).toHaveTitle(/CodeLab/);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    }
    await page.goto('/');
    await page.screenshot({ path: `test-results/public-${width}.png`, fullPage: true, animations: 'disabled' });
    await page.getByText('Can I submit code and run Java now?', { exact: true }).click();
    await expect(page.getByText(/You can write and submit Java code/)).toBeVisible();
    await page.getByRole('navigation', { name: 'Public navigation' }).getByRole('link', { name: 'Contact' }).click();
    await expect(page.getByText(/No public social-media page/)).toBeVisible();
    await expect(page.locator('main')).toBeFocused();
    await page.getByRole('link', { name: 'Privacy Policy', exact: true }).click();
    await expect(page.getByText(/Draft/, { exact: false }).first()).toBeVisible();
  });
}

for (const width of [360, 768, 1366]) {
  test(`account forms fit and remain accessible at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.route('**/api/v1/me', route => route.fulfill({ status: 401, json: { message: 'Unauthenticated.' } }));
    for (const route of ['/login', '/register', '/forgot-password', '/reset-password?token=preview&email=preview@example.test']) {
      await page.goto(route);
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeEnabled();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `test-results/account-${width}-${route.split('?')[0].slice(1)}.png`, fullPage: true, animations: 'disabled' });
    }
  });
}

test('verification errors explain recovery and keep sign-out available', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.route('**/api/v1/me', route => route.fulfill({ json: { data: { id: '999', name: 'Verification Preview', email: 'verification@example.test', role: 'instructor', email_verified_at: null, student_number: null } } }));
  for (const [reason, text] of [['invalid-link', 'belongs to another account'], ['too-many-requests', 'Wait 60 seconds']]) {
    await page.goto(`/verify-email?error=${reason}`);
    await expect(page.getByRole('alert')).toContainText(text);
    await expect(page.getByRole('alert')).toContainText('verification@example.test');
    await expect(page.getByRole('button', { name: 'Sign out', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
