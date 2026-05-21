import { expect, test } from "@playwright/test";

test.describe("Driver Diagram smoke flows", () => {
  test("edits the form, syncs Mermaid, and opens preview modal", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("document-title-input")).toBeVisible();
    await page.getByTestId("document-title-input").fill("Smoke Diagram");
    await page.getByTestId("purpose-title-input").fill("Smoke Purpose");
    await page.getByTestId("purpose-kpi-input").fill("KPI line 1");

    await page.getByTestId("add-primary-button").scrollIntoViewIfNeeded();
    await page.getByTestId("add-primary-button").click({ force: true });
    await page.getByTestId("primary-title-input-0").fill("Access Flow");

    await page.getByTestId("code-tab-button").scrollIntoViewIfNeeded();
    await page.getByTestId("code-tab-button").click({ force: true });
    await expect(page.getByTestId("mermaid-code-input")).toHaveValue(/Smoke Purpose/);
    await expect(page.getByTestId("mermaid-code-input")).toHaveValue(/Access Flow/);

    await page.getByTestId("preview-tab-button").click({ force: true });
    await expect(page.getByTestId("preview-panel")).toBeVisible();

    await page.getByTestId("open-preview-modal-button").click({ force: true });
    await expect(page.getByTestId("close-preview-modal-button")).toBeVisible();
    await page.getByTestId("close-preview-modal-button").click({ force: true });
    await expect(page.getByTestId("close-preview-modal-button")).toBeHidden();
  });

  test("switches language and keeps editor interactive", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-toggle-en").click({ force: true });
    await expect(page.getByText("Create a Driver Diagram with KPI at every level", { exact: false })).toBeVisible();

    await page.getByTestId("language-toggle-th").click({ force: true });
    await expect(page.getByText("สร้าง Driver Diagram พร้อม KPI ทุกระดับ", { exact: false })).toBeVisible();

    await page.getByTestId("code-tab-button").scrollIntoViewIfNeeded();
    await page.getByTestId("code-tab-button").click({ force: true });
    await expect(page.getByTestId("mermaid-code-input")).toBeVisible();
  });
});
