import { expect, test } from '@playwright/test';

test.describe('ReuseFlow End-to-End Judge Smoke Walkthrough (/ -> /demo)', () => {
  test('completes full 90-second judge journey: landing -> demo -> intake -> explainable assessment -> approval -> Scenario Lab -> reset', async ({
    page,
  }) => {
    // 1. Open landing page and click Try Interactive Demo
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        name: /Turn donated electronics into transparent, human-approved refurbishment decisions/i,
      })
    ).toBeVisible();

    await page.getByRole('link', { name: /Try Interactive Demo/i }).first().click();
    await expect(page).toHaveURL(/\/demo/);

    // 2. Check Fictional Sample Data banner & populated metrics
    await expect(page.getByText('Fictional Sample Data')).toBeVisible();
    await expect(page.getByText('FG-DEMO-101').first()).toBeVisible();

    // 3. Click New Device Intake and create a safe viable laptop
    await page.getByRole('button', { name: /New Device Intake/i }).click();
    await page.getByLabel(/Internal Asset Tag/i).fill('FG-E2E-777');
    await page.getByLabel(/Brand/i).fill('Lenovo');
    await page.getByLabel(/Model/i).fill('ThinkPad T14 E2E');
    await page.getByRole('button', { name: /Save Device & Run Assessment/i }).click();

    // 4. Inspect assessment explanation and approve for refurbishment
    await expect(page.getByText('FG-E2E-777').first()).toBeVisible();
    await expect(page.getByText('VIABLE_COST_AND_FUNCTION').first()).toBeVisible();

    await page
      .getByLabel(/Select Authorized Next Workflow Action/i)
      .selectOption('approved_refurb');
    await page
      .getByLabel(/Immutable Workflow Audit Note/i)
      .fill('E2E judge walkthrough manager approval');
    await page
      .getByRole('button', { name: /Approve for Refurbishment/i })
      .click();

    await expect(
      page.getByText('E2E judge walkthrough manager approval')
    ).toBeVisible();

    // 5. Open Scenario Lab and adjust inputs
    await page.getByRole('button', { name: /Scenario Lab/i }).click();
    await expect(
      page.getByText(/Illustrative scenario · not measured organizational performance/i).first()
    ).toBeVisible();
    await expect(page.getByText('$200.00/mo').first()).toBeVisible();

    const volumeInput = page.getByLabel('Monthly device volume numeric input');
    await volumeInput.fill('200');
    await expect(page.getByText('$400.00/mo').first()).toBeVisible();

    // 6. Reset demo sandbox and confirm FG-E2E-777 is cleared
    await page.getByRole('button', { name: /Reset Demo Sandbox/i }).click();
    await expect(page.getByText('FG-E2E-777')).toHaveCount(0);
  });

  test('renders cleanly at 375px mobile viewport without horizontal overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/demo');
    await expect(page.getByText('Fictional Sample Data')).toBeVisible();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(overflow).toBe(false);
  });
});
