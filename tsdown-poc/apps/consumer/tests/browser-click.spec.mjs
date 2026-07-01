import { expect, test } from "playwright/test";

test("lazy counter resumes and handles clicks", async ({ page }) => {
  const consoleIssues = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.stack ?? error.message);
  });

  await page.goto("/", { waitUntil: "networkidle" });

  const count = page.getByTestId("poc-count");
  const button = page.getByTestId("poc-increment");

  await expect(count).toHaveText("Count: 2");
  await expect(button).toHaveAttribute("on:click", /#/);

  await button.click();
  await expect(count).toHaveText("Count: 5", { timeout: 10_000 });

  const showcase = page.getByTestId("library-showcase");
  const asset = page.getByTestId("library-asset");
  const score = page.getByTestId("library-score");
  const complexAction = page.getByTestId("poc-complex-action");

  await expect(showcase).toHaveAttribute("data-tone", "focus");
  await expect(showcase).toHaveCSS("border-left-color", "rgb(15, 118, 110)");
  await expect(page.getByTestId("projected-summary")).toContainText(
    "Consumer supplied summary",
  );
  await expect(page.getByTestId("projected-default")).toContainText(
    "Consumer projected details",
  );
  await expect(asset).toHaveAttribute("src", /data:image\/svg|library-badge/);
  expect(await asset.evaluate((node) => node.naturalWidth)).toBeGreaterThan(0);
  await expect(score).toContainText("Score: 7");
  await expect(complexAction).toHaveAttribute("on:click", /#/);

  const clickListenerCount = await page.evaluate(
    () => document.querySelectorAll("[on\\:click]").length,
  );
  expect(clickListenerCount).toBeGreaterThanOrEqual(2);

  await complexAction.click();
  await expect(score).toContainText("Score: 12", { timeout: 10_000 });
  await expect(page.getByTestId("complex-clicks")).toHaveText("Clicks: 1");
  await page.waitForTimeout(250);

  expect(pageErrors, "uncaught page exceptions").toEqual([]);
  expect(consoleIssues, "browser console warnings/errors").toEqual([]);
});
