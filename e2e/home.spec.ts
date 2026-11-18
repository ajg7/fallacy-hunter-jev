import { expect, test } from "@playwright/test";

test("home page renders and the counter increments", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Fallacy Hunter" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Count is 0" }).click();
  await expect(page.getByRole("button", { name: "Count is 1" })).toBeVisible();
});
