import { expect, test } from "@playwright/test";

const sessionJson = process.env.E2E_SUPABASE_SESSION || "";
const supabaseUrl = process.env.E2E_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const storageKey =
  process.env.E2E_SUPABASE_STORAGE_KEY ||
  (supabaseUrl ? `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token` : "");

let maybeSession = null;
try {
  maybeSession = sessionJson ? JSON.parse(sessionJson) : null;
} catch (_error) {
  maybeSession = null;
}

test.describe("Authenticated gallery flows", () => {
  test.skip(!maybeSession || !storageKey, "Requires E2E_SUPABASE_SESSION and Supabase URL/storage key.");

  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.addInitScript(
      ({ key, session }) => {
        window.localStorage.setItem(key, JSON.stringify(session));
      },
      { key: storageKey, session: maybeSession }
    );
  });

  test("saves, shares, and publishes a diagram into the gallery", async ({ page }) => {
    await page.goto("/");

    await page.getByTestId("language-toggle-en").click({ force: true });
    await expect(page.getByText("Private workspace active")).toBeVisible();

    await page.getByTestId("document-title-input").fill("Authenticated Flow Diagram");
    await page.getByTestId("purpose-title-input").fill("Authenticated Gallery Purpose");
    await page.getByTestId("save-diagram-button").click({ force: true });
    await expect(page.getByText("Saved to database.")).toBeVisible();

    const savedCard = page.locator("[data-testid^='saved-diagram-card-']").first();
    await expect(savedCard).toContainText("Authenticated Flow Diagram");

    const shareButton = savedCard.locator("[data-testid^='share-diagram-button-']").first();
    await shareButton.click({ force: true });
    await expect(page.getByText("Read-only share link copied.", { exact: false })).toBeVisible();

    const galleryButton = savedCard.locator("[data-testid^='toggle-gallery-button-']").first();
    await galleryButton.click({ force: true });
    await expect(page.getByText("Submitted this diagram to the gallery.")).toBeVisible();

    await page.getByText("Open gallery").click({ force: true });
    await expect(page.getByText("Authenticated Flow Diagram")).toBeVisible();
  });
});
