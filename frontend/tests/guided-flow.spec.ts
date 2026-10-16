import { test, expect } from '@playwright/test';

const TOKEN = process.env.TEST_WORKSPACE_TOKEN || 'l23kTxGL6jBc21F0AMTvB2A6VYJfzco0VcqBqsZxTlbz2qGi';

test('guided multi-page workflow: dashboard -> new -> brief -> negotiation -> proposal -> review -> payment', async ({ page, browser }) => {
  test.slow();
  // 1. Login at entry page
  await page.goto('/');
  await page.getByLabel(/workspace access code|private access token/i).fill(TOKEN);
  await page.getByRole('button', { name: 'Open workspace' }).click();

  // 2. Arrive at /dashboard
  await page.waitForURL('**/dashboard');
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Deal overview' })).toBeVisible();

  // 3. Navigate to /deals/new
  await page.getByRole('button', { name: /create a deal/i }).click();
  await page.waitForURL('**/deals/new');
  await expect(page).toHaveURL(/\/deals\/new/);
  await expect(page.getByRole('heading', { name: 'Create a deal' })).toBeVisible();

  // 4. Fill Create Deal form
  const dealTitle = 'Guided E2E Agreement ' + Date.now();
  await page.getByLabel('Project title').fill(dealTitle);
  await page.getByLabel('Your name').fill('Alex');
  await page.getByLabel('Client name').fill('Jordan');
  await page.getByLabel('Asking price (USD)').fill('350');
  await page.getByLabel('Private minimum (USD)').fill('250');
  await page.getByRole('button', { name: /Create & get invitation/i }).click();

  // 5. Arrive at /deals/[dealId]/brief
  await page.waitForURL(/\/deals\/[^/]+\/brief/);
  await expect(page.getByRole('heading', { name: 'Project brief & requirements' })).toBeVisible();

  // 6. Verify SharePanel invitation link & copy feedback
  const invite = await page.getByLabel('Client invitation link').inputValue();
  expect(invite).toContain('?deal=');
  const copyBtn = page.getByRole('button', { name: /copy link/i });
  await copyBtn.click();
  await expect(page.getByRole('button', { name: /✓ Copied/i })).toBeVisible();

  // 7. Fill Brief & click Save brief
  await page.getByLabel('What are we building?').fill('Full stack web app with PayPal checkout, 7 days delivery.');
  await page.getByRole('button', { name: 'Save brief', exact: true }).click();

  // 8. Arrive at /deals/[dealId]/proposal
  await page.waitForURL(/\/deals\/[^/]+\/proposal/);
  await expect(page.getByRole('heading', { name: /Create a proposal/i })).toBeVisible();

  // 9. Use Stepper navigation to visit Negotiation page
  await page.getByRole('link', { name: 'Negotiation' }).click();
  await page.waitForURL(/\/deals\/[^/]+\/negotiation/);
  await expect(page.getByRole('heading', { name: /Conversation & activity/i })).toBeVisible();

  // Send a message in negotiation
  await page.getByLabel('Message').fill('Initial requirements are set. Ready to review proposal.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Initial requirements are set. Ready to review proposal.')).toBeVisible();

  // Click "Go to proposal" to return to Proposal page
  await page.getByRole('button', { name: /Go to proposal/i }).click();
  await page.waitForURL(/\/deals\/[^/]+\/proposal/);

  // 10. Submit proposal on Proposal page
  await page.getByLabel('Amount (USD)', { exact: true }).fill('350');
  await page.getByRole('button', { name: /Submit proposal for review/i }).click();

  // 11. Arrive at /deals/[dealId]/review
  await page.waitForURL(/\/deals\/[^/]+\/review/);
  await expect(page.getByRole('heading', { name: /Current agreement & review/i })).toBeVisible();

  // Freelancer approves terms
  await page.getByRole('button', { name: 'Approve these exact terms' }).click();
  await expect(page.getByRole('button', { name: 'You approved' })).toBeDisabled();

  // 12. Client context opens invitation link
  const clientContext = await browser.newContext();
  const clientPage = await clientContext.newPage();
  await clientPage.goto(invite);

  // Client lands on review page
  await clientPage.waitForURL(/\/deals\/[^/]+\/review/);
  await expect(clientPage.getByText('Private to you')).toHaveCount(0);

  // Client approves terms
  await clientPage.getByRole('button', { name: 'Approve these exact terms' }).click();
  await expect(clientPage.getByRole('button', { name: 'You approved' })).toBeDisabled();

  // Both approved! Client navigates to Payment page
  const payBtn = clientPage.getByRole('button', { name: /(continue to paypal|view payment status)/i });
  await expect(payBtn).toBeVisible();
  await payBtn.click();

  await clientPage.waitForURL(/\/deals\/[^/]+\/payment/);
  await expect(clientPage.getByRole('heading', { name: /Agreement checkout/i })).toBeVisible();

  // 13. Complete payment with Sandbox Simulator
  const simBtn = clientPage.getByRole('button', { name: /complete with sandbox simulator/i });
  if (await simBtn.isVisible()) {
    await simBtn.click();
    await expect(clientPage.getByText(/Payment verified & agreement locked/i)).toBeVisible();
    await expect(clientPage.getByRole('button', { name: /View Official Agreement & Payment Certificate/i })).toBeVisible();
  }

  await clientContext.close();
});

test('browser refresh and direct link preservation', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/workspace access code|private access token/i).fill(TOKEN);
  await page.getByRole('button', { name: 'Open workspace' }).click();
  await page.waitForURL('**/dashboard');

  // Open first deal
  const firstDealLink = page.locator('.deal-nav').first();
  if (await firstDealLink.isVisible()) {
    await firstDealLink.click();
    await page.waitForURL(/\/deals\/[^/]+/);
    const currentUrl = page.url();

    // Reload page directly
    await page.reload();
    await expect(page).toHaveURL(currentUrl);
    await expect(page.getByRole('navigation', { name: 'Workflow progress' })).toBeVisible();
  }
});

test('mobile viewports have zero overflow across guided pages', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Agree on the work/i })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.getByLabel(/workspace access code|private access token/i).fill(TOKEN);
  await page.getByRole('button', { name: 'Open workspace' }).click();
  await page.waitForURL('**/dashboard');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
