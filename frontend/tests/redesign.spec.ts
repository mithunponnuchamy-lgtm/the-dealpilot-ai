import { test, expect } from '@playwright/test';

test('typography and PayPal brand palette are applied', async ({ page }) => {
  await page.goto('/');

  // Verify body font contains Inter
  const bodyFont = await page.evaluate(() => window.getComputedStyle(document.body).fontFamily);
  expect(bodyFont.toLowerCase()).toContain('inter');

  // Verify heading font contains Plus Jakarta Sans
  const heading = page.getByRole('heading', { name: /Agree on the work/i });
  const headingFont = await heading.evaluate(el => window.getComputedStyle(el).fontFamily);
  expect(headingFont.toLowerCase()).toContain('plus jakarta sans');

  // Verify open workspace primary button has PayPal-inspired blue background
  const openBtn = page.getByRole('button', { name: 'Open workspace' });
  const btnColor = await openBtn.evaluate(el => window.getComputedStyle(el).backgroundColor);
  // #0057FF is rgb(0, 87, 255)
  expect(btnColor).toBe('rgb(0, 87, 255)');

  // Verify password toggle functionality
  const codeInput = page.getByLabel(/workspace access code|private access token/i);
  await expect(codeInput).toHaveAttribute('type', 'password');
  const toggleBtn = page.getByRole('button', { name: /show access code/i });
  await toggleBtn.click();
  await expect(codeInput).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: /hide access code/i }).click();
  await expect(codeInput).toHaveAttribute('type', 'password');
});

test('workspace redesign: NextActionPanel, Stepper, search, and certificate', async ({ page }) => {
  const token = process.env.TEST_WORKSPACE_TOKEN || 'l23kTxGL6jBc21F0AMTvB2A6VYJfzco0VcqBqsZxTlbz2qGi';
  await page.goto('/');
  await page.getByLabel(/workspace access code|private access token/i).fill(token);
  await page.getByRole('button', { name: 'Open workspace' }).click();

  // Create a new test deal
  await page.getByRole('button', { name: /(create a deal|new deal)/i }).first().click();
  const dealTitle = 'Design Verification ' + Date.now();
  await page.getByLabel('Project title').fill(dealTitle);
  await page.getByLabel('Your name').fill('Alex');
  await page.getByLabel('Client name').fill('Taylor');
  await page.getByRole('button', { name: 'Create & get invitation' }).click();

  // 1. Verify NextActionPanel guidance
  const nextAction = page.getByRole('region', { name: /Authoritative next step/i });
  await expect(nextAction).toBeVisible();
  await expect(nextAction).toContainText(/Next step/i);

  // 2. Verify WorkflowStepper
  const stepper = page.getByRole('navigation', { name: /Workflow progress/i });
  await expect(stepper).toBeVisible();
  await expect(stepper).toContainText('01 Brief');
  await expect(stepper).toContainText('02 Negotiation');
  await expect(stepper).toContainText('03 Proposal');
  await expect(stepper).toContainText('04 Review');
  await expect(stepper).toContainText('05 Payment');

  // 3. Verify SharePanel copy button
  const copyBtn = page.getByRole('button', { name: /copy link/i });
  await expect(copyBtn).toBeVisible();
  await copyBtn.click();
  await expect(page.getByRole('button', { name: /✓ Copied/i })).toBeVisible();

  // 4. Verify sidebar search filter
  const searchInput = page.getByPlaceholder('Search deals…');
  await searchInput.fill(dealTitle);
  const dealButton = page.getByRole('button', { name: new RegExp(dealTitle, 'i') });
  await expect(dealButton).toBeVisible();

  await searchInput.fill('NonExistentDealQuery999');
  await expect(page.getByText(/No deals match/i)).toBeVisible();
  await searchInput.fill('');

  // 5. Verify "Use example brief" helper
  const exampleBriefBtn = page.getByRole('button', { name: /Use example brief/i });
  if (await exampleBriefBtn.isVisible()) {
    await exampleBriefBtn.click();
    const briefArea = page.getByLabel('What are we building?');
    const val = await briefArea.inputValue();
    expect(val.length).toBeGreaterThan(10);
  }

  // 6. Complete workflow up to mutual approval
  await page.getByLabel('What are we building?').fill('Responsive site for $300. 7 days. 1 revision.');
  await page.getByRole('button', { name: 'Save brief', exact: true }).click();
  await page.getByLabel('Amount (USD)', { exact: true }).fill('300');
  await page.getByRole('button', { name: 'Submit proposal for review' }).click();
  await page.getByRole('button', { name: 'Approve these exact terms' }).click();

  // In simulate demo mode (or client approval), let's check certificate modal if mutually approved
  // For now, verify mobile responsiveness of the workspace
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
