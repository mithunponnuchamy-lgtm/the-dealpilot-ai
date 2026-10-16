import {test,expect} from '@playwright/test';
test('two people review and approve a stored proposal',async({page,browser})=>{
  await page.goto('/');
  const token = process.env.TEST_WORKSPACE_TOKEN || 'e2e-only-not-a-real-token-'+'x'.repeat(32);
  await page.getByLabel(/workspace access code|private access token/i).fill(token);
  await page.getByRole('button',{name:'Open workspace'}).click();
  await page.getByRole('button',{name:/(create a deal|new deal)/i}).first().click();
  await page.getByLabel('Project title').fill('Browser acceptance project');
  await page.getByLabel('Your name').fill('Freelancer');
  await page.getByLabel('Client name').fill('Client');
  await page.getByRole('button',{name:'Create & get invitation'}).click();
  const invite=await page.getByLabel('Client invitation link').inputValue();
  await page.getByLabel('What are we building?').fill('Three-page website for $250. Seven days. One revision.');
  await page.getByRole('button',{name:'Save brief',exact:true}).click();
  await page.getByLabel('Amount (USD)',{exact:true}).fill('250');
  await page.getByRole('button',{name:'Submit proposal for review'}).click();
  await page.getByRole('button',{name:'Approve these exact terms'}).click();
  await expect(page.getByRole('button',{name:'You approved'})).toBeDisabled();
  const clientContext=await browser.newContext();
  const client=await clientContext.newPage();
  await client.goto(invite);
  await expect(client.getByText('Private to you')).toHaveCount(0);
  await client.getByRole('button',{name:'Approve these exact terms'}).click();
  await expect(client.getByRole('button',{name:'You approved'})).toBeDisabled();
  // Providers intentionally unavailable in this isolated browser test.
  await expect(client.getByRole('button',{name:/(continue to paypal|complete with sandbox simulator)/i})).toBeVisible();
  await client.reload();
  await expect(client.getByRole('button',{name:'You approved'})).toBeDisabled();
  await clientContext.close();
});
test('mobile entry fits its viewport',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto('/');
  await expect(page.getByRole('heading',{name:/Agree on the work/i})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
});
